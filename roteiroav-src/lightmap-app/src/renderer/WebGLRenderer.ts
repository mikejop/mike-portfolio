import { 
    BASE_VERTEX_SHADER, BASE_FRAGMENT_SHADER, 
    SHADOW_PASS_VS, SHADOW_PASS_FS,
    QUAD_VERTEX_SHADER, LIGHT_ACCUM_FS,
    GAUSSIAN_BLUR_FS, BLOOM_COMPOSITE_FS
} from './shaders';
import { mat4, vec2 } from 'gl-matrix';
import { Camera } from './Camera';
import type { Wall } from './Geometry';
import { generateSceneGeometry } from './Geometry';

export interface Light {
    id: string;
    position: vec2;
    color: number[]; // [r, g, b]
    intensity: number;
    range: number;
}

export class WebGLRenderer {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram | null = null;
    private shadowProgram: WebGLProgram | null = null;
    private lightProgram: WebGLProgram | null = null;
    private blurProgram: WebGLProgram | null = null;
    private bloomCompositeProgram: WebGLProgram | null = null;
    
    private vao: WebGLVertexArrayObject | null = null;
    private quadVao: WebGLVertexArrayObject | null = null;
    private vertexCount: number = 0;
    private lights: Light[] = [];
    public camera: Camera;

    // FBOs
    private lightAccumFBO: WebGLFramebuffer | null = null;
    private lightAccumTex: WebGLTexture | null = null;
    private shadowMapFBO: WebGLFramebuffer | null = null;
    private shadowMapTex: WebGLTexture | null = null;
    private blurFBOs: (WebGLFramebuffer | null)[] = [null, null];
    private blurTextures: (WebGLTexture | null)[] = [null, null];
    private SHADOW_MAP_RES = 1024;

    constructor(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext('webgl2', {
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true,
        });

        if (!gl) {
            throw new Error('WebGL 2.0 not supported');
        }

        this.gl = gl;
        this.camera = new Camera();
        this.lights = [
            { id: 'l1', position: vec2.fromValues(0, 0), color: [1, 0.4, 0.2], intensity: 1.0, range: 800 },
            { id: 'l2', position: vec2.fromValues(300, 300), color: [0.2, 0.6, 1.0], intensity: 1.0, range: 600 },
            { id: 'l3', position: vec2.fromValues(-400, 200), color: [0.4, 1.0, 0.4], intensity: 1.0, range: 700 },
        ];

        // Ensure extensions are initialized at least once
        gl.getExtension('EXT_color_buffer_float');
        gl.getExtension('EXT_float_blend');
        
        this.init();
    }

    private createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Could not create shader');
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Could not compile WebGL shader. \\n\\n' + info);
        }
        return shader;
    }

    private createProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
        const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        
        const program = gl.createProgram();
        if (!program) throw new Error('Could not create program');
        
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw new Error('Could not link WebGL program. \\n\\n' + info);
        }
        return program;
    }

    private initFBOs() {
        const { gl } = this;
        
        // Use high-range colors only if both rendering and blending extensions are available
        const canRenderFloat = gl.getExtension('EXT_color_buffer_float');
        const canBlendFloat = gl.getExtension('EXT_float_blend');
        const useFloat = !!(canRenderFloat && canBlendFloat);
        
        const internalFormat = useFloat ? gl.RGBA16F : gl.RGBA8;
        const type = useFloat ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;

        const w = Math.floor(gl.canvas.width);
        const h = Math.floor(gl.canvas.height);

        // 1. Light Accumulation FBO
        this.lightAccumFBO = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightAccumFBO);
        
        this.lightAccumTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.lightAccumTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, gl.RGBA, type, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.lightAccumTex, 0);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.warn("Light Accumulation FBO incomplete. Falling back to default.");
        }

        // 2. 1D Shadow Map FBO
        this.shadowMapFBO = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapFBO);
        
        this.shadowMapTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.shadowMapTex);
        
        const shadowInternal = useFloat ? gl.R32F : gl.RGBA8;
        const shadowFormat = useFloat ? gl.RED : gl.RGBA;
        const shadowType = useFloat ? gl.FLOAT : gl.UNSIGNED_BYTE;
        
        gl.texImage2D(gl.TEXTURE_2D, 0, shadowInternal, this.SHADOW_MAP_RES, 1, 0, shadowFormat, shadowType, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.shadowMapTex, 0);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.warn("Shadow Map FBO incomplete. Shadows may be disabled.");
        }

        // 3. Gaussian Blur Ping-pong FBOs
        const bw = Math.floor(w / 4);
        const bh = Math.floor(h / 4);
        for (let i = 0; i < 2; i++) {
            this.blurFBOs[i] = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurFBOs[i]);
            this.blurTextures[i] = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.blurTextures[i]);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, bw, bh, 0, gl.RGBA, type, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.blurTextures[i], 0);
            
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                console.warn(`Blur FBO ${i} incomplete.`);
            }
        }

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error("Critical: Framebuffer incomplete even with fallback.");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    private init() {
        const { gl } = this;
        this.initFBOs();
        
        this.program = this.createProgram(gl, BASE_VERTEX_SHADER, BASE_FRAGMENT_SHADER);
        this.shadowProgram = this.createProgram(gl, SHADOW_PASS_VS, SHADOW_PASS_FS);
        this.lightProgram = this.createProgram(gl, QUAD_VERTEX_SHADER, LIGHT_ACCUM_FS);
        this.blurProgram = this.createProgram(gl, QUAD_VERTEX_SHADER, GAUSSIAN_BLUR_FS);
        this.bloomCompositeProgram = this.createProgram(gl, QUAD_VERTEX_SHADER, BLOOM_COMPOSITE_FS);

        // Enable depth testing for 3D extrusions
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // Setup VAO for geometry
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const testWalls: Wall[] = [
            { id: 'w1', points: [[-600, -600], [600, -600], [600, 600], [-600, 600], [-600, -600]], height: 80, thickness: 30, color: [0.1, 0.1, 0.1, 1] }, // Border
            { id: 'w2', points: [[-300, -300], [-300, 300]], height: 180, thickness: 40, color: [0.15, 0.15, 0.15, 1] },
            { id: 'w3', points: [[300, -300], [300, 300]], height: 180, thickness: 40, color: [0.15, 0.15, 0.15, 1] },
            { id: 'w4', points: [[-150, 0], [150, 0]], height: 120, thickness: 40, color: [0.15, 0.15, 0.15, 1] }
        ].map(w => ({ ...w, points: w.points.map(p => vec2.fromValues(p[0], p[1])) }));

        const geometry = generateSceneGeometry(testWalls);
        this.vertexCount = geometry.length / 7;

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);
        
        const posLoc = gl.getAttribLocation(this.program, 'a_position');
        const colLoc = gl.getAttribLocation(this.program, 'a_color');

        const STRIDE = 7 * 4;
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, STRIDE, 0);
        gl.enableVertexAttribArray(colLoc);
        gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, STRIDE, 3 * 4);

        // Setup Quad VAO
        this.quadVao = gl.createVertexArray();
        gl.bindVertexArray(this.quadVao);
        const quadPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]), gl.STATIC_DRAW);
        const qPosLoc = gl.getAttribLocation(this.lightProgram, 'a_position');
        gl.enableVertexAttribArray(qPosLoc);
        gl.vertexAttribPointer(qPosLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
    }

    public setLights(lights: Light[]) {
        this.lights = lights;
    }

    public resize(width: number, height: number) {
        const { gl } = this;
        gl.viewport(0, 0, width, height);
        this.camera.resize(width, height);
    }

    public render(_time: number) {
        const { gl } = this;
        
        // --- 1. LIGHT ACCUMULATION PASS ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightAccumFBO);
        gl.viewport(0, 0, Math.floor(gl.canvas.width), Math.floor(gl.canvas.height));
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST); // Crucial: no depth buffer on this FBO
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE); // Additive blending for lights

        const invViewProj = mat4.create();
        mat4.multiply(invViewProj, this.camera.projectionMatrix, this.camera.viewMatrix);
        mat4.invert(invViewProj, invViewProj);

        const elapsed = _time / 1000;

        for (let i = 0; i < this.lights.length; i++) {
            const light = this.lights[i];
            const seed = i * 1.5;
            
            // Pulse: 0.8 to 1.2 x intensity
            const pulse = 1.0 + Math.sin(elapsed * 2.5 + seed) * 0.2;
            const currentIntensity = light.intensity * pulse;
            
            // Drift: Lissajous curve
            const dx = Math.sin(elapsed * 1.2 + seed) * 10;
            const dy = Math.cos(elapsed * 1.5 + seed) * 10;
            const animPos = vec2.fromValues(light.position[0] + dx, light.position[1] + dy);

            // A. Shadow Map Render
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapFBO);
            gl.viewport(0, 0, this.SHADOW_MAP_RES, 1);
            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.disable(gl.DEPTH_TEST); // No depth on 1D shadow map
            
            gl.useProgram(this.shadowProgram!);
            gl.uniform2fv(gl.getUniformLocation(this.shadowProgram!, 'u_lightPos'), animPos);
            gl.uniform1f(gl.getUniformLocation(this.shadowProgram!, 'u_lightRange'), light.range);
            
            gl.bindVertexArray(this.vao);
            gl.drawArrays(gl.POINTS, 0, this.vertexCount);

            // B. Accumulate Light
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightAccumFBO);
            gl.viewport(0, 0, Math.floor(gl.canvas.width), Math.floor(gl.canvas.height));
            gl.useProgram(this.lightProgram!);
            gl.bindVertexArray(this.quadVao);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.shadowMapTex);
            gl.uniform1i(gl.getUniformLocation(this.lightProgram!, 'u_shadowMap'), 0);
            
            gl.uniform2fv(gl.getUniformLocation(this.lightProgram!, 'u_lightPos'), animPos);
            gl.uniform3fv(gl.getUniformLocation(this.lightProgram!, 'u_lightColor'), light.color);
            gl.uniform1f(gl.getUniformLocation(this.lightProgram!, 'u_lightIntensity'), currentIntensity);
            gl.uniform1f(gl.getUniformLocation(this.lightProgram!, 'u_lightRange'), light.range);
            gl.uniformMatrix4fv(gl.getUniformLocation(this.lightProgram!, 'u_invViewProj'), false, invViewProj);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        // --- 2. BLOOM BLUR PASS (Ping-pong) ---
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        let horizontal = true;
        let firstIteration = true;
        gl.useProgram(this.blurProgram!);
        gl.bindVertexArray(this.quadVao);

        const bw = Math.floor(gl.canvas.width / 4);
        const bh = Math.floor(gl.canvas.height / 4);

        for (let i = 0; i < 4; i++) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurFBOs[horizontal ? 1 : 0]);
            gl.viewport(0, 0, bw, bh);
            gl.uniform1i(gl.getUniformLocation(this.blurProgram!, 'u_horizontal'), horizontal ? 1 : 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, firstIteration ? this.lightAccumTex : this.blurTextures[horizontal ? 0 : 1]);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            horizontal = !horizontal;
            firstIteration = false;
        }

        // --- 3. FINAL COMPOSITE PASS ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, Math.floor(gl.canvas.width), Math.floor(gl.canvas.height));
        gl.clearColor(0.02, 0.10, 0.12, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        // A. Base Scene
        gl.useProgram(this.program!);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program!, 'u_projection'), false, this.camera.projectionMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program!, 'u_view'), false, this.camera.viewMatrix);
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);

        // B. Bloom Composite
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // Proper composition
        gl.useProgram(this.bloomCompositeProgram!);
        gl.bindVertexArray(this.quadVao);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.lightAccumTex); // Scene accumulation
        gl.uniform1i(gl.getUniformLocation(this.bloomCompositeProgram!, 'u_scene'), 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.blurTextures[0]); // Bloomed highlights
        gl.uniform1i(gl.getUniformLocation(this.bloomCompositeProgram!, 'u_bloomBlur'), 1);
        
        gl.uniform1f(gl.getUniformLocation(this.bloomCompositeProgram!, 'u_exposure'), 1.0);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}

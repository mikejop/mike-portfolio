import { mat4, vec3 } from 'gl-matrix';

export class Camera {
    public projectionMatrix: mat4;
    public viewMatrix: mat4;
    
    private position: vec3 = vec3.fromValues(0, 0, 0);
    private zoom: number = 1.0;
    private aspect: number = 1.0;

    constructor() {
        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.updateMatrices();
    }

    public resize(width: number, height: number) {
        this.aspect = width / height;
        this.updateMatrices();
    }

    public setZoom(zoom: number) {
        this.zoom = zoom;
        this.updateMatrices();
    }

    public pan(dx: number, dy: number) {
        this.position[0] += dx / this.zoom;
        this.position[1] += dy / this.zoom;
        this.updateMatrices();
    }

    private updateMatrices() {
        // 1. Orthographic Projection
        const w = 1000 * this.aspect;
        const h = 1000;
        mat4.ortho(this.projectionMatrix, -w, w, -h, h, -5000, 5000);

        // 2. Apply Isometric Shear
        // We want to tilt the Z-axis (height) towards the top-left.
        // Matrix: [ 1, 0, sx, 0 ]
        //         [ 0, 1, sy, 0 ]
        //         [ 0, 0, 1, 0 ]
        //         [ 0, 0, 0, 1 ]
        const shear = mat4.create();
        shear[8] = -0.4; // sx
        shear[9] = 0.4;  // sy
        mat4.multiply(this.projectionMatrix, this.projectionMatrix, shear);

        // 3. View Matrix (Zoom & Pan)
        mat4.identity(this.viewMatrix);
        mat4.scale(this.viewMatrix, this.viewMatrix, [this.zoom, this.zoom, 1]);
        mat4.translate(this.viewMatrix, this.viewMatrix, [-this.position[0], -this.position[1], 0]);
    }
}

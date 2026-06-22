export const BASE_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;

out vec4 v_color;

void main() {
    gl_Position = u_projection * u_view * vec4(a_position, 1.0);
    v_color = a_color;
}`;

export const BASE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 outColor;

void main() {
    outColor = v_color;
}`;

export const QUAD_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export const SHADOW_PASS_VS = `#version 300 es
layout(location = 0) in vec3 a_position;

uniform vec2 u_lightPos;
uniform float u_lightRange;

out float v_dist;

#define PI 3.14159265359

void main() {
    vec2 dir = a_position.xy - u_lightPos;
    float dist = length(dir);
    float angle = atan(dir.y, dir.x);
    
    // Map angle [-PI, PI] to [-1, 1] for 1D viewport
    gl_Position = vec4(angle / PI, 0.0, 0.0, 1.0);
    gl_PointSize = 2.0; // Ensure coverage
    v_dist = dist / u_lightRange;
}`;

export const SHADOW_PASS_FS = `#version 300 es
precision highp float;
in float v_dist;
out vec4 outColor;

void main() {
    outColor = vec4(v_dist, v_dist, v_dist, 1.0);
}`;

export const LIGHT_ACCUM_FS = `#version 300 es
precision highp float;

uniform sampler2D u_shadowMap;
uniform vec2 u_lightPos;
uniform vec3 u_lightColor;
uniform float u_lightIntensity;
uniform float u_lightRange;
uniform vec2 u_resolution;
uniform mat4 u_invViewProj;

in vec2 v_uv;
out vec4 outColor;

#define PI 3.14159265359

float sampleShadow(float angle) {
    return texture(u_shadowMap, vec2(angle / (2.0 * PI) + 0.5, 0.5)).r;
}

void main() {
    // 1. Reconstruct world position from UV
    vec4 clipPos = vec4(v_uv * 2.0 - 1.0, 0.0, 1.0);
    vec4 worldPos4 = u_invViewProj * clipPos;
    vec2 worldPos = worldPos4.xy / worldPos4.w;
    
    // 2. Compute distance and angle to light
    vec2 dir = worldPos - u_lightPos;
    float dist = length(dir);
    float angle = atan(dir.y, dir.x);
    
    // 3. Shadow Test with PCF (Poisson sampling for soft edges)
    float shadow = 0.0;
    float bias = 0.005;
    float currentDist = dist / u_lightRange;
    
    // Simple 5-tap PCF
    float blur = 0.005;
    for(float i=-2.0; i<=2.0; i+=1.0) {
        float s = sampleShadow(angle + i * blur);
        shadow += (currentDist - bias > s) ? 0.0 : 1.0;
    }
    shadow /= 5.0;
    
    // 4. Inverse Square Falloff
    float attenuation = 1.0 / (1.0 + (dist*dist) / (u_lightRange * 0.1));
    attenuation *= max(0.0, 1.0 - dist / u_lightRange);
    
    vec3 finalColor = u_lightColor * u_lightIntensity * attenuation * shadow;
    outColor = vec4(finalColor, 1.0);
}`;

export const GAUSSIAN_BLUR_FS = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform bool u_horizontal;
const float u_weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.0162162);

in vec2 v_uv;
out vec4 outColor;

void main() {
    vec2 tex_offset = 1.0 / vec2(textureSize(u_image, 0));
    vec3 result = texture(u_image, v_uv).rgb * u_weight[0];
    
    if(u_horizontal) {
        for(int i = 1; i < 5; ++i) {
            result += texture(u_image, v_uv + vec2(tex_offset.x * float(i), 0.0)).rgb * u_weight[i];
            result += texture(u_image, v_uv - vec2(tex_offset.x * float(i), 0.0)).rgb * u_weight[i];
        }
    } else {
        for(int i = 1; i < 5; ++i) {
            result += texture(u_image, v_uv + vec2(0.0, tex_offset.y * float(i))).rgb * u_weight[i];
            result += texture(u_image, v_uv - vec2(0.0, tex_offset.y * float(i))).rgb * u_weight[i];
        }
    }
    outColor = vec4(result, 1.0);
}`;

export const BLOOM_COMPOSITE_FS = `#version 300 es
precision highp float;

uniform sampler2D u_scene;
uniform sampler2D u_bloomBlur;
uniform float u_exposure;

in vec2 v_uv;
out vec4 outColor;

void main() {
    const float gamma = 2.2;
    vec3 sceneColor = texture(u_scene, v_uv).rgb;
    vec3 bloomColor = texture(u_bloomBlur, v_uv).rgb;
    
    // Additive blending
    sceneColor += bloomColor;
    
    // Tone mapping (basic exposure)
    vec3 result = vec3(1.0) - exp(-sceneColor * u_exposure);
    // Gamma correction
    result = pow(result, vec3(1.0 / gamma));
    
    outColor = vec4(result, 1.0);
}`;

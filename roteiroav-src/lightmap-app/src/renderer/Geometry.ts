import { vec2 } from 'gl-matrix';

export interface Wall {
    id: string;
    points: vec2[];
    height: number;
    thickness: number;
    color: number[]; // [r, g, b, 1]
}

export function generateSceneGeometry(walls: Wall[], floorSize: number = 2000) {
    const vertices: number[] = [];
    
    // 1. Add Floor (large quad at z=0)
    // Attributes: pos(3), color(4)
    const fs = floorSize / 2;
    const floorColor = [0.02, 0.10, 0.12, 1.0]; // #051a1f
    
    const addQuad = (p1: number[], p2: number[], p3: number[], p4: number[], color: number[]) => {
        // Triangle 1
        vertices.push(...p1, ...color);
        vertices.push(...p2, ...color);
        vertices.push(...p3, ...color);
        // Triangle 2
        vertices.push(...p1, ...color);
        vertices.push(...p3, ...color);
        vertices.push(...p4, ...color);
    };

    addQuad([-fs, fs, 0], [fs, fs, 0], [fs, -fs, 0], [-fs, -fs, 0], floorColor);

    // 2. Add Walls
    for (const wall of walls) {
        const pts = wall.points;
        const th = wall.thickness;
        const h = wall.height;
        const color = wall.color;
        const sideColor = color.map(c => c * 0.5); // Darker for sides

        for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i+1];
            
            // Calculate direction and normal for thickness
            const dx = p2[0] - p1[0];
            const dy = p2[1] - p1[1];
            const len = Math.sqrt(dx*dx + dy*dy);
            const nx = -dy / len;
            const ny = dx / len;

            // 4 corners of the top face
            const c1 = [p1[0] + nx * th/2, p1[1] + ny * th/2, h];
            const c2 = [p2[0] + nx * th/2, p2[1] + ny * th/2, h];
            const c3 = [p2[0] - nx * th/2, p2[1] - ny * th/2, h];
            const c4 = [p1[0] - nx * th/2, p1[1] - ny * th/2, h];

            // Top Face
            addQuad(c1, c2, c3, c4, color);

            // Side Faces (Front, Back, and caps if needed)
            // Front side
            addQuad(
                [c1[0], c1[1], 0], [c2[0], c2[1], 0], [c2[0], c2[1], h], [c1[0], c1[1], h],
                sideColor
            );
            // Back side
            addQuad(
                [c4[0], c4[1], 0], [c3[0], c3[1], 0], [c3[0], c3[1], h], [c4[0], c4[1], h],
                sideColor
            );
        }
    }

    return new Float32Array(vertices);
}

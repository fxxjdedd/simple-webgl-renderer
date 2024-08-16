import { Vec3 } from "gl-matrix";

export function calcBBox(positions: number[]): [Vec3, Vec3] {
    const bboxMin = [Infinity, Infinity, Infinity];
    const bboxMax = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) {
        const pos = [positions[i], positions[i + 1], positions[i + 2]];
        bboxMin[0] = Math.min(bboxMin[0], pos[0]);
        bboxMin[1] = Math.min(bboxMin[1], pos[1]);
        bboxMin[1] = Math.min(bboxMin[2], pos[2]);
        bboxMax[0] = Math.max(bboxMax[0], pos[0]);
        bboxMax[1] = Math.max(bboxMax[1], pos[1]);
        bboxMax[2] = Math.max(bboxMax[2], pos[2]);
    }

    return [new Vec3(...bboxMin), new Vec3(...bboxMax)];
}

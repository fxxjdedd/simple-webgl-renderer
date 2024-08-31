import { Mat4, Mat4Like } from "gl-matrix";
export function retrivePosition(mat4: Mat4Like) {
    return [mat4[12], mat4[13], mat4[14]];
}

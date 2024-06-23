import { vec3 as Vector3, mat4 as Matrix4, quat as Quaterion } from "gl-matrix";
import { pathtracerShader } from "../shader";
import { GL_Program } from "./glProgram";
import { Camera, Mesh } from "../core";

export class GL_WebGLRenderer {
    ctx: WebGLRenderingContext;
    programs: GL_Program[];
    constructor(canvas: HTMLCanvasElement) {
        const gl = (this.ctx = canvas.getContext("webgl"));
        this.programs = [new GL_Program(gl, pathtracerShader)];
    }
    render(mesh: Mesh, camera: Camera) {
        const gl = this.ctx;
        Matrix4.multiply(mesh.mvMatrix, camera.matrixWorldInv, mesh.matrixWorld);
        // prettier-ignore
        this.program.setUniformWithSetter("u_projMatrix", camera.projectionMatrix, gl.uniformMatrix4fv);
        this.program.setUniformWithSetter("u_mvMatrix", mesh.mvMatrix, gl.uniformMatrix4fv);

        gl.enableVertexAttribArray();
        mesh.geometry;
    }
}

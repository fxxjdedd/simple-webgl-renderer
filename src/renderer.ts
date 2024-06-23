import { vec3 as Vector3, mat4 as Matrix4, quat as Quaterion } from "gl-matrix";
import { pathtracerShader } from "./shader";
import { GL_Program } from "./gl/glProgram";
import { Camera, Material, Mesh, PathTracerMaterial } from "./core";
import { GL_BindingState, GL_BindingStates } from "./gl/glBindingStates";

export class WebGLRenderer {
    ctx: WebGL2RenderingContext;
    programs: Map<Material, GL_Program>;
    bindingStates: GL_BindingStates;

    constructor(canvas: HTMLCanvasElement) {
        const gl = (this.ctx = canvas.getContext("webgl2"));
        this.programs = new Map();
        this.programs.set(PathTracerMaterial, new GL_Program(gl, pathtracerShader));

        this.bindingStates = new GL_BindingStates(gl);
    }
    render(mesh: Mesh, camera: Camera) {
        const gl = this.ctx;
        Matrix4.multiply(mesh.mvMatrix, camera.matrixWorldInv, mesh.matrixWorld);

        const program = this.programs.get(mesh.material);
        if (!program) {
            throw new Error("No property program found for material: " + mesh.material.name);
        }

        // prettier-ignore
        program.setUniformWithSetter("u_projMatrix", camera.projectionMatrix, gl.uniformMatrix4fv);
        program.setUniformWithSetter("u_mvMatrix", mesh.mvMatrix, gl.uniformMatrix4fv);

        let bindingState: GL_BindingState;
        if ((bindingState = this.bindingStates.getBindingState(program, mesh.geometry))) {
            bindingState.bind();
        } else {
            this.bindingStates.setBindingState(program, mesh.geometry);
        }
    }
}

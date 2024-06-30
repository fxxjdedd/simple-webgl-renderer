import { vec3 as Vector3, mat4 as Matrix4, quat as Quaterion, vec3 } from "gl-matrix";
import { pathtracerShader } from "./shader";
import { GL_Program } from "./gl/glProgram";
import { Camera, Material, Mesh, PathTracerMaterial } from "./core";
import { GL_BindingState, GL_BindingStates } from "./gl/glBindingStates";

export class WebGLRenderer {
    gl: WebGL2RenderingContext;
    programs: Map<string, GL_Program>;
    bindingStates: GL_BindingStates;

    constructor(canvas: HTMLCanvasElement) {
        const gl = (this.gl = canvas.getContext("webgl2"));
        this.programs = new Map();
        this.programs.set(PathTracerMaterial.name, new GL_Program(gl, pathtracerShader));

        this.bindingStates = new GL_BindingStates(gl);
    }
    render(mesh: Mesh, camera: Camera) {
        Matrix4.multiply(mesh.mvMatrix, camera.matrixWorldInv, mesh.matrixWorld);

        const program = this.programs.get(mesh.material.name);
        if (!program) {
            throw new Error("No properly program found for material: " + mesh.material.name);
        }
        this.gl.useProgram(program.program);

        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clearDepth(1);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // prettier-ignore
        program.setUniform("u_projMatrix", camera.projectionMatrix);
        program.setUniform("u_mvMatrix", mesh.mvMatrix);

        let bindingState: GL_BindingState;
        if (!(bindingState = this.bindingStates.getBindingState(program, mesh.geometry))) {
            bindingState = this.bindingStates.setBindingState(program, mesh.geometry);
        }
        bindingState.bind();

        program.draw(0, bindingState.indexBuffer.structuredData.getTrangleCount());
    }
}

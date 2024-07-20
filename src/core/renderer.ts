import { Vec3, Mat4, Quat } from "gl-matrix";
import { deferredShader, pbrShader, unlitShader } from "../shader";
import { GL_Program } from "../gl/glProgram";
import { Camera, Material, Mesh, DeferredMaterial, PBRMaterial, UnlitMaterial, Scene } from "./core";
import { GL_BindingState, GL_BindingStates } from "../gl/glBindingStates";
import { WebGLRenderTarget } from "./renderTarget";
import { GL_State } from "../gl/glState";
import { GL_Texture } from "../gl/glTexture";

export class WebGLRenderer {
    gl: WebGL2RenderingContext;
    programs: Map<string, GL_Program>;
    state: GL_State;
    bindingStates: GL_BindingStates;

    constructor(public canvas: HTMLCanvasElement) {
        const gl = (this.gl = canvas.getContext("webgl2"));
        this.programs = new Map();
        this.programs.set(DeferredMaterial.name, new GL_Program(gl, deferredShader));
        this.programs.set(PBRMaterial.name, new GL_Program(gl, pbrShader));
        this.programs.set(UnlitMaterial.name, new GL_Program(gl, unlitShader));
        this.state = new GL_State(gl);
        this.bindingStates = new GL_BindingStates(gl);
    }

    render(scene: Scene, camera: Camera) {
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clearDepth(1);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        camera.updateMatrixWorld();
        for (const mesh of scene.objects) {
            if (mesh instanceof Mesh) {
                this.renderMesh(mesh, camera);
            }
        }
    }

    renderMesh(mesh: Mesh, camera: Camera) {
        mesh.updateMatrixWorld();
        Mat4.multiply(mesh.mvMatrix, camera.matrixWorldInv, mesh.matrixWorld);

        const program = this.programs.get(mesh.material.name);
        if (!program) {
            throw new Error("No properly program found for material: " + mesh.material.name);
        }

        GL_Texture.ResetTextureUnit();
        this.state.bindTexture(null);

        this.gl.useProgram(program.program);

        // prettier-ignore
        program.setUniform("u_projMatrix", camera.projectionMatrix);
        program.setUniform("u_mvMatrix", mesh.mvMatrix);

        for (const name in mesh.material.uniforms) {
            const value = mesh.material.uniforms[name];
            if (value instanceof GL_Texture) {
                this.state.bindTexture(value);
                program.setUniform(name, value.unit);
                // this.gl.uniform1i(this.gl.getUniformLocation(program.program, "map"), 5);
            } else {
                program.setUniform(name, value);
            }
        }

        let bindingState: GL_BindingState;
        if (!(bindingState = this.bindingStates.getBindingState(program, mesh.geometry))) {
            bindingState = this.bindingStates.setBindingState(program, mesh.geometry);
        }
        bindingState.bind();

        program.draw(0, bindingState.indexBuffer.structuredData.getTrangleCount());
    }

    setRenderTarget(renderTarget: WebGLRenderTarget) {
        if (renderTarget !== null) {
            renderTarget.setupRenderTarget(this.gl, this.state);

            this.state.bindFrameBuffer(renderTarget.framebuffer);
            this.state.drawBuffers(renderTarget);
            this.setViewport(0, 0, renderTarget.width, renderTarget.height);

            // https://www.khronos.org/opengl/wiki/Framebuffer_Object#Framebuffer_Completeness
            // const r = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        } else {
            this.state.bindFrameBuffer(null);
            this.state.drawBuffers(null);
            this.setViewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    setViewport(x, y, w, h) {
        this.gl.viewport(x, y, w, h);
    }
}

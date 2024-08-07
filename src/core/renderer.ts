import { Vec3, Mat4, Quat, Vec4, Mat3 } from "gl-matrix";
import { deferredShader, pbrShader, deferredDebugShader } from "../shader";
import { GL_Program } from "../gl/glProgram";
import { Camera, Material, Mesh, Scene } from "./core";
import { GL_BindingState, GL_BindingStates } from "../gl/glBindingStates";
import { WebGLRenderTarget } from "./renderTarget";
import { GL_State } from "../gl/glState";
import { GL_Texture } from "../gl/glTexture";
import { Light } from "./light";
import { GL_RenderState } from "../gl/glRenderState";
import { DeferredDebugMaterial, DeferredMaterial, PBRMaterial } from "../materials";

export class WebGLRenderer {
    gl: WebGL2RenderingContext;
    programs: Map<string, GL_Program>;
    state: GL_State;
    renderState: GL_RenderState;
    bindingStates: GL_BindingStates;
    clearBits = 0;
    viewport: Vec4;

    constructor(public canvas: HTMLCanvasElement) {
        const gl = (this.gl = canvas.getContext("webgl2"));
        this.programs = new Map();
        this.programs.set(DeferredMaterial.name, new GL_Program(gl, deferredShader));
        this.programs.set(PBRMaterial.name, new GL_Program(gl, pbrShader));
        this.programs.set(DeferredDebugMaterial.name, new GL_Program(gl, deferredDebugShader));
        this.state = new GL_State(gl);
        this.bindingStates = new GL_BindingStates(gl);
        this.clearBits = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT;
        this.viewport = new Vec4(0, 0, this.canvas.width, this.canvas.height);
        this.renderState = new GL_RenderState();
    }

    render(scene: Scene, camera: Camera) {
        this.gl.clearColor(0, 0, 0, 1);
        // NOTE: depth is not linear, see: https://learnopengl.com/Advanced-OpenGL/Depth-testing
        this.gl.clearDepth(1);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        if (this.clearBits > 0) {
            this.gl.clear(this.clearBits);
        }

        this.renderState.clear();

        camera.updateMatrixWorld();

        for (const obj of scene.objects) {
            if (obj instanceof Light) {
                this.renderState.addLight(obj);
            }
        }

        this.renderState.setup();

        for (const obj of scene.objects) {
            if (obj instanceof Mesh) {
                this.renderMesh(obj, camera);
            }
        }

        this.clearBits = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT;
        this.viewport = new Vec4(0, 0, this.canvas.width, this.canvas.height);
    }

    renderMesh(mesh: Mesh, camera: Camera) {
        mesh.updateMatrixWorld();
        Mat4.multiply(mesh.mvMatrix, camera.matrixWorldInv, mesh.matrixWorld);
        Mat3.fromMat4(mesh.normalMatrix, Mat4.clone(mesh.mvMatrix).invert().transpose());

        const program = this.programs.get(mesh.material.name);
        if (!program) {
            throw new Error("No properly program found for material: " + mesh.material.name);
        }

        GL_Texture.ResetTextureUnit();
        this.state.bindTexture(null);

        this.gl.useProgram(program.program);

        // prettier-ignore
        program.setUniform("projMatrix", camera.projectionMatrix);
        program.setUniform("mvMatrix", mesh.mvMatrix);
        program.setUniform("viewMatrix", camera.matrixWorldInv);
        program.setUniform("modelMatrix", mesh.matrixWorld);
        program.setUniform("normalMatrix", mesh.normalMatrix);
        program.setUniform("viewport", this.viewport);
        if (this.renderState.hasLight) {
            program.setUniform("dirLight", this.renderState.lights.dirLights[0]);
        }

        for (const name in mesh.material.uniforms) {
            const value = mesh.material.uniforms[name];
            if (value instanceof GL_Texture) {
                this.state.bindTexture(value);
                program.setUniform(name, value.unit);
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
        this.viewport.set([x, y, w, h]);
        this.gl.viewport(x, y, w, h);
    }

    setClearbits(bits) {
        this.clearBits = bits;
    }
}

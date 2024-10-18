import { Vec3, Mat4, Quat, Vec4, Mat3 } from "gl-matrix";
import { GL_Program } from "../gl/glProgram";
import { Camera, Geometry, Group, Material, Mesh, Object3D, OrthoCamera, PerspectiveCamera, Scene } from "./core";
import { GL_BindingState, GL_BindingStates } from "../gl/glBindingStates";
import { WebGLRenderTarget } from "./renderTarget";
import { GL_State } from "../gl/glState";
import { Light } from "./light";
import { GL_RenderState } from "../gl/glRenderState";
import { GL_Textures } from "../gl/glTextures";
import { Texture } from "./texture";
import { GL_ConstantsMapping } from "../gl/glConstantsMapping";
import { GL_ProgramManager } from "../gl/glProgramManager";
import { DepthTexture } from "../textures/DepthTexture";
import { GL_ShadowDepthPass } from "../gl/pass/glShadowDepthPass";
import { ShaderMaterial } from "../materials/ShaderMaterial";

export class WebGLRenderer {
    gl: WebGL2RenderingContext;
    programManager: GL_ProgramManager;
    textures: GL_Textures;
    state: GL_State;
    renderState: GL_RenderState;
    bindingStates: GL_BindingStates;
    constantsMapping: GL_ConstantsMapping;
    clearBits = 0;
    viewport: Vec4;
    shadowDepthPass: GL_ShadowDepthPass;
    currentRenderTarget: WebGLRenderTarget = null;

    enableShadowPass = false;

    constructor(public canvas: HTMLCanvasElement) {
        const gl = (this.gl = canvas.getContext("webgl2", {
            depth: true,
            stencil: false,
            alpha: false,
            antialias: false,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false,
        }));
        this.programManager = new GL_ProgramManager(gl);
        this.constantsMapping = new GL_ConstantsMapping(gl);
        this.state = new GL_State(gl, this.constantsMapping);
        this.textures = new GL_Textures(gl, this.constantsMapping, this.state);
        this.bindingStates = new GL_BindingStates(gl);
        this.clearBits = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT;
        this.viewport = new Vec4(0, 0, this.canvas.width, this.canvas.height);
        this.renderState = new GL_RenderState(gl, this.viewport);
        this.shadowDepthPass = new GL_ShadowDepthPass(this);
    }

    render(scene: Scene, camera: Camera) {
        this.renderState.clear();

        camera.updateMatrixWorld();

        traverseScene(scene, {
            caseLight: (light) => {
                light.updateMatrixWorld();
                this.renderState.addLight(light);
            },
            caseMesh: (mesh) => {
                if (mesh.material.enableDeferredRendering) {
                    this.renderState.addDeferredMesh(mesh);
                }
            },
        });

        if (this.enableShadowPass) {
            const shadowLights = this.renderState.getLights().filter((light) => light.castShadow);

            this.shadowDepthPass.render(shadowLights, scene, camera);
        }

        this.renderState.setup();

        const forwardPassMeshes: Mesh[] = [];

        if (this.renderState.hasDeferredMesh) {
            const current = this.currentRenderTarget;
            this.setRenderTarget(this.renderState.getDerferredRenderTarget());
            this.gl.clearColor(0, 0, 0, 1);
            this.clear();

            for (const [mesh, defferedMeshDef] of this.renderState.deferred.deferredMeshes) {
                this.renderObject(mesh, defferedMeshDef.geometry, defferedMeshDef.material, camera);
            }

            this.setRenderTarget(current);

            this.gl.clearColor(0, 0, 0, 1);
            this.clear();

            const forwardMeshDefs = this.renderState.deferred.batchedForwardMeshes;

            forwardPassMeshes.push(...forwardMeshDefs.map((def) => new Mesh(def.geometry, def.material)));
        } else {
            traverseScene(scene, {
                caseMesh: (mesh) => {
                    forwardPassMeshes.push(mesh);
                },
            });
        }

        for (const mesh of forwardPassMeshes) {
            const material = scene.overrideMaterial ?? mesh.material;
            this.renderObject(mesh, mesh.geometry, material, camera);
        }

        this.clearBits = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT;
        this.viewport = new Vec4(0, 0, this.canvas.width, this.canvas.height);
    }

    renderObject(object: Object3D, geometry: Geometry, material: Material, camera: Camera) {
        object.updateMatrixWorld();

        Mat4.multiply(object.mvMatrix, camera.matrixWorldInv, object.matrixWorld);

        Mat3.fromMat4(object.normalMatrix, Mat4.clone(object.mvMatrix).invert().transpose());

        const defines = {};
        for (const name in material.uniforms) {
            const value = material.uniforms[name];
            if (name === "normalMap" && value instanceof Texture) {
                defines["USE_NORMAL_MAP"] = 1;
            }

            if (name === "map" && value instanceof Texture) {
                defines["USE_MAP"] = 1;
            }

            if (name === "map" && value instanceof DepthTexture) {
                defines["IS_DEPTH_MAP"] = 1;
            }
        }

        if (camera instanceof PerspectiveCamera) {
            defines["PERSPECTIVE_CAMERA"] = 1;
        } else if (camera instanceof OrthoCamera) {
            defines["ORTHOGRAPHIC_CAMERA"] = 1;
        } else {
            throw new Error("Not supported camera type: " + camera.constructor.name);
        }

        if (material instanceof ShaderMaterial) {
            Object.assign(defines, material.defines);
        }

        const program = this.programManager.getProgram(material, defines);
        if (!program) {
            throw new Error("No properly program found for material: " + material.name);
        }

        this.textures.resetTextureUnit();

        this.gl.useProgram(program.program);

        // prettier-ignore
        program.setUniform("projMatrix", camera.projectionMatrix);
        program.setUniform("mvMatrix", object.mvMatrix);
        program.setUniform("viewMatrix", camera.matrixWorldInv);
        program.setUniform("modelMatrix", object.matrixWorld);
        program.setUniform("normalMatrix", object.normalMatrix);
        program.setUniform("viewport", this.viewport);
        program.setUniform("logDepthFactor", 2.0 / (Math.log(camera.far + 1.0) / Math.LN2));
        if (this.renderState.hasLight) {
            // TODO: multiple light
            program.setUniform("dirLight", this.renderState.lights.dirLights[0]);
            program.setUniform("dirLightShadow", this.renderState.lights.dirLightShadows[0]);
            program.setUniform("dirLightShadowMap", this.renderState.lights.dirLightShadowMaps[0], this.textures);
            program.setUniform("dirLightShadowMatrix", this.renderState.lights.dirLightShadowMatrixs[0]);
        }

        if (material.enableDeferredRendering || material instanceof ShaderMaterial) {
            const gbuffer = this.renderState.getDeferredGBuffer();
            material.uniforms["g_diffuse"] = gbuffer.diffuse;
            material.uniforms["g_normal"] = gbuffer.normal;
            // use g-buffer packed depth instead of depth texture
            material.uniforms["g_depth"] = gbuffer.depth;
        }

        for (const name in material.uniforms) {
            let value = material.uniforms[name];
            if (value instanceof Texture) {
                program.setUniform(name, value, this.textures);
            } else {
                if (typeof value == "object" && "value" in value) {
                    value = value.value;
                }
                program.setUniform(name, value);
            }
        }

        this.state.setMaterial(material);

        let bindingState: GL_BindingState;
        if (!(bindingState = this.bindingStates.getBindingState(program, geometry))) {
            bindingState = this.bindingStates.setBindingState(program, geometry);
        }

        bindingState.bind();

        this.renderBufferDirect(program, bindingState);
    }

    renderBufferDirect(program: GL_Program, bindingState: GL_BindingState) {
        if (bindingState.indexBuffer) {
            program.drawElements(0, bindingState.indexBuffer.structuredData.getTriangleCount());
        } else {
            const vertexStructuredData = bindingState.vertexAttributeBuffer.structuredData;
            const positionAccessor = vertexStructuredData.accessors.position;
            const positionCount = vertexStructuredData.getCountOf(positionAccessor);
            program.drawArray(0, positionCount);
        }
    }

    setRenderTarget(renderTarget: WebGLRenderTarget) {
        if (renderTarget !== null) {
            this.currentRenderTarget = renderTarget;
            renderTarget.setupRenderTarget(this.gl, this.textures);

            this.state.bindFrameBuffer(renderTarget.framebuffer);
            this.state.drawBuffers(renderTarget);
            this.setViewport(0, 0, renderTarget.width, renderTarget.height);

            // https://www.khronos.org/opengl/wiki/Framebuffer_Object#Framebuffer_Completeness
            // const r = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        } else {
            this.currentRenderTarget = null;
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

    clear() {
        if (this.clearBits > 0) this.gl.clear(this.clearBits);
    }
}

function traverseScene(
    scene: { children: Object3D[] },
    callbacks: {
        caseLight?(light: Light): any;
        caseMesh?(mesh: Mesh): any;
    }
) {
    for (const item of scene.children) {
        if (item instanceof Light) {
            callbacks.caseLight?.(item);
        } else if (item instanceof Mesh) {
            callbacks.caseMesh?.(item);
        } else if (item instanceof Group) {
            traverseScene(item, callbacks);
        }
    }
}

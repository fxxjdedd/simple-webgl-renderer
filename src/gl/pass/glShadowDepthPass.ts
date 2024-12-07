import { Mat4 } from "gl-matrix";
import { Camera, Mesh, Object3D, Scene } from "../../core/core";
import { Light } from "../../core/light";
import { WebGLRenderTarget } from "../../core/renderTarget";
import { WebGLRenderer } from "../../core/renderer";
import { DepthMaterial } from "../../materials";

export class GL_ShadowDepthPass {
    constructor(private renderer: WebGLRenderer) {}

    render(lights: Light[], scene: Scene, camera: Camera) {
        const originRenderTarget = this.renderer.currentRenderTarget;
        for (const light of lights) {
            if (light.shadow.map == null) {
                light.shadow.map = new WebGLRenderTarget(this.renderer.viewport.z, this.renderer.viewport.w, {
                    enableDepthBuffer: true, // must set true so that depth test could work
                });
            }

            this.renderer.setRenderTarget(light.shadow.map);
            const gl = this.renderer.gl;
            gl.clearColor(1, 1, 1, 1); // set clear color to white so that shadow map always safe for non-recevie-shadow objects
            gl.enable(gl.DEPTH_TEST);
            this.renderer.clear();

            light.shadow.updateShadowCamera();

            this.renderShadowMap(scene, camera, light.shadow.camera, light);
        }
        this.renderer.setRenderTarget(originRenderTarget);
    }

    renderShadowMap(
        object: Object3D,
        camera: Camera,
        shadowCamera: Camera,
        light: Light,
        parentCastShadow = false,
        parentReceiveShadow = false
    ) {
        const gl = this.renderer.gl;
        if (parentCastShadow || parentReceiveShadow || object.castShadow || object.receiveShadow) {
            if (object instanceof Mesh) {
                Mat4.multiply(object.mvMatrix, shadowCamera.matrixWorldInv, object.matrixWorld);
                // TODO: cache depthMaterial
                const depthMaterial = new DepthMaterial();
                depthMaterial.blending.enabled = false;

                if (object.receiveShadow) {
                    gl.cullFace(gl.FRONT);
                }
                this.renderer.renderObject(object, object.geometry, depthMaterial, shadowCamera);

                if (object.receiveShadow) {
                    gl.cullFace(gl.BACK);
                }
            }
        }

        for (const childObject of object.children) {
            this.renderShadowMap(
                childObject,
                camera,
                shadowCamera,
                light,
                parentCastShadow || object.castShadow,
                parentReceiveShadow || object.receiveShadow
            );
        }
    }
}

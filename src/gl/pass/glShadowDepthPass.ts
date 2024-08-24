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
                light.shadow.map = new WebGLRenderTarget(this.renderer.viewport.z, this.renderer.viewport.w);
            }
            this.renderer.setRenderTarget(light.shadow.map);
            this.renderer.gl.clear(this.renderer.clearBits);

            light.shadow.updateShadowCamera();

            this.renderShadowMap(scene, camera, light.shadow.camera, light);
        }
        this.renderer.setRenderTarget(originRenderTarget);
    }

    renderShadowMap(object: Object3D, camera: Camera, shadowCamera: Camera, light: Light) {
        if (object.castShadow) {
            if (object instanceof Mesh) {
                Mat4.multiply(object.mvMatrix, shadowCamera.matrixWorldInv, object.matrixWorld);
                // TODO: cache depthMaterial
                const depthMaterial = new DepthMaterial();
                this.renderer.renderObject(object, object.geometry, depthMaterial, shadowCamera);
            }
        }

        for (const childObject of object.children) {
            this.renderShadowMap(childObject, camera, shadowCamera, light);
        }
    }
}

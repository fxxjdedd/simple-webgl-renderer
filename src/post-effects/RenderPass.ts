import { WebGLRenderTarget } from "../core/renderTarget";
import { WebGLRenderer } from "../core/renderer";
import { Camera, Mesh, Scene } from "../core/core";
import { ShaderMaterial } from "../materials/ShaderMaterial";
import * as copyShader from "../shader/copy";
import { ScreenPlane } from "../geometry/ScreenPlane";

export class RenderPass {
    screenMesh: Mesh;
    screen: Scene;

    copyMaterial: ShaderMaterial;

    constructor(private camera: Camera) {
        this.screenMesh = new Mesh(new ScreenPlane(), null);
        this.screen = new Scene([this.screenMesh]); // TODO: let renderer support mesh directly

        this.copyMaterial = new ShaderMaterial({
            vertexShader: copyShader.vertex,
            fragmentShader: copyShader.fragment,
        });
    }
    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget) {
        // copy current screen to copyRenderTarget
        this.screenMesh.material = this.copyMaterial;
        this.screenMesh.material.map = readBuffer.texture;
        this.screenMesh.material.blending.enabled = false;
        renderer.setRenderTarget(writeBuffer);
        renderer.render(this.screen, this.camera);
    }
}

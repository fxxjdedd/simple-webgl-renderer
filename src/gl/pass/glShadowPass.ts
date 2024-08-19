import { Camera, Scene } from "../../core/core";
import { Light } from "../../core/light";
import { WebGLRenderer } from "../../core/renderer";

export class GL_ShadowPass {
    constructor(private renderer: WebGLRenderer) {}

    render(lights: Light[], scene: Scene, camera: Camera) {}
}

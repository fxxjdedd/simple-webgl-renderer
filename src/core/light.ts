import { Vec3, Vec4 } from "gl-matrix";
import { Camera, Object3D } from "./core";
import { WebGLRenderTarget } from "./renderTarget";

export class Light extends Object3D {
    intensity = 1;
    color = new Vec3(1, 1, 1, 1);
    castShadow = false;

    constructor() {
        super();
    }
}
export class DirectionalLight extends Light {
    target: Object3D;
    shadow: LightShadow;
    constructor() {
        super();
        this.target = new Object3D();
        this.position = new Vec3(0, 1, 0);
        this.shadow = new LightShadow();
    }
}

export class LightShadow {
    map: WebGLRenderTarget;
    camera: Camera;
    constructor() {}
}

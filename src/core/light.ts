import { Mat4, Vec3, Vec4 } from "gl-matrix";
import { Camera, Object3D, OrthoCamera } from "./core";
import { WebGLRenderTarget } from "./renderTarget";
import { retrivePosition } from "../util/matrix";
import { Frustum } from "../math";

export class Light extends Object3D {
    intensity = 1;
    color = new Vec3(1, 1, 1, 1);
    shadow: LightShadow;
    target: Object3D;

    constructor() {
        super();
        this.shadow = new LightShadow(this);
    }
}
export class DirectionalLight extends Light {
    constructor() {
        super();
        this.target = new Object3D();
        this.position = new Vec3(0, 1, 0);
    }
}

export class LightShadow {
    map: WebGLRenderTarget;
    camera: Camera;
    frustum: Frustum;
    constructor(public light: Light) {
        this.camera = new OrthoCamera();
        this.frustum = new Frustum();
    }

    updateShadowCamera() {
        const posWorld = new Vec3(...retrivePosition(this.light.matrixWorld));
        const targetWorld = new Vec3(...retrivePosition(this.light.target.matrixWorld));

        this.camera.position.copy(posWorld);
        this.camera.lookAt(targetWorld.x, targetWorld.y, targetWorld.z);

        const vpMatrix = Mat4.multiply(new Mat4(), this.camera.projectionMatrix, this.camera.matrixWorldInv);
        this.frustum.setFromProjectionMatrix(vpMatrix);
    }
}

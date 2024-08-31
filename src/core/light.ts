import { Mat4, Vec2, Vec3, Vec4 } from "gl-matrix";
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
    vpMatrix: Mat4;
    camera: Camera = new OrthoCamera();
    frustum: Frustum = new Frustum();
    map: WebGLRenderTarget = null;
    map2: WebGLRenderTarget = null;
    bias = 0;
    normalBias = 0;
    radius = 1;
    blurSamples = 8;
    mapSize = new Vec2(512, 512);
    constructor(public light: Light) {
        this.camera = new OrthoCamera(-1, 1, 1, -1, 0.01, 500);
        this.frustum = new Frustum();
        this.vpMatrix = new Mat4();
    }

    updateShadowCamera() {
        const posWorld = new Vec3(...retrivePosition(this.light.matrixWorld));
        const targetWorld = new Vec3(...retrivePosition(this.light.target.matrixWorld));
        this.camera.position.copy(posWorld);
        this.camera.lookAt(targetWorld.x, targetWorld.y, targetWorld.z);

        Mat4.multiply(this.vpMatrix, this.camera.projectionMatrix, this.camera.matrixWorldInv);

        this.frustum.setFromProjectionMatrix(this.vpMatrix);
    }
}

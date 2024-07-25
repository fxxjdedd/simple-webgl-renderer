import { Vec3, Vec4 } from "gl-matrix";
import { Object3D } from "./core";

export class Light extends Object3D {
    intensity = 1;
    color = new Vec4(1, 1, 1, 1);

    constructor() {
        super();
    }
}
export class DirectionalLight extends Light {
    target: Object3D;
    constructor() {
        super();
        this.target = new Object3D();
        this.position = new Vec3(0, 1, 0);
    }
}

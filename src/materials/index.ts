import { Vec3 } from "gl-matrix";
import { Material } from "../core/core";

export class DeferredMaterial extends Material {
    // TODO:
    // static name = "DeferredMaterial";
    constructor() {
        super("DeferredMaterial");
    }
}

export class DeferredDebugMaterial extends Material {
    // TODO:
    // static name = "DeferredDebugMaterial";
    constructor() {
        super("DeferredDebugMaterial");
    }
}

export class PBRMaterial extends Material {
    // TODO:
    // static name = "PBRMaterial";
    metalness: number = 0;
    roughness: number = 1;
    color = new Vec3(1, 1, 1);
    constructor() {
        super("PBRMaterial");
    }
}

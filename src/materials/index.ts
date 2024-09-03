import { Vec3, Vec4 } from "gl-matrix";
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
export class DebugMaterial extends Material {
    // TODO:
    // static name = "DebugMaterial";
    constructor() {
        super("DebugMaterial");
    }
}

export class PBRMaterial extends Material {
    // TODO:
    // static name = "PBRMaterial";
    metalness: number = 0;
    roughness: number = 1;
    color = new Vec4(1, 1, 1, 1);
    constructor() {
        super("PBRMaterial");
    }
}

export class DepthMaterial extends Material {
    // TODO:
    // static name = "DepthMaterial";
    constructor() {
        super("DepthMaterial");
    }
}

export class NormalMaterial extends Material {
    // TODO:
    // static name = "NormalMaterial";
    constructor() {
        super("NormalMaterial");
    }
}

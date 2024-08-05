import { Vec3, Mat3, Mat4, Quat } from "gl-matrix";
import { BufferLayout, StructuredData, TypedArrayCode } from "../util";
import { DEG2RAD } from "../math/math";
import { GL_Texture } from "../gl/glTexture";

class Material {
    _map: GL_Texture;
    set map(v) {
        this._map = v;
        this.uniforms["map"] = v;
    }

    get map() {
        return this._map;
    }

    uniforms: Record<string, any> = {};
    constructor(public name: string) {}
}
class DeferredMaterial extends Material {
    // TODO:
    // static name = "DeferredMaterial";
    constructor() {
        super("DeferredMaterial");
    }
}

class PBRMaterial extends Material {
    // TODO:
    // static name = "PBRMaterial";
    constructor() {
        super("PBRMaterial");
    }
}

class DeferredDebugMaterial extends Material {
    // TODO:
    // static name = "DeferredDebugMaterial";
    constructor() {
        super("DeferredDebugMaterial");
    }
}

class Geometry<T extends BufferLayout = BufferLayout> {
    index: number[];
    attributes: Record<keyof T, number[]>;
    constructor(public layout: T) {
        this.attributes = {} as any;
    }
    setIndex(indices: number[]) {
        this.index = indices;
    }

    setAttribute(name: keyof T, attrBuffer: number[]) {
        this.attributes[name] = attrBuffer;
    }
}

class Object3D {
    parent: Object3D;
    matrix: Mat4;
    matrixWorld: Mat4;
    matrixWorldInv: Mat4;
    position: Vec3;
    rotation: Mat4;
    quaterion: Quat;
    up: Vec3;
    scale: Vec3;

    mvMatrix: Mat4;
    normalMatrix: Mat3;
    constructor() {
        this.matrix = Mat4.create();
        this.matrixWorld = Mat4.create();
        this.matrixWorldInv = Mat4.create();
        this.position = Vec3.create();
        this.rotation = Mat4.create();
        this.quaterion = Quat.create();
        this.up = Vec3.fromValues(0, 1, 0);
        this.scale = Vec3.fromValues(1, 1, 1);

        this.mvMatrix = Mat4.create();
        this.normalMatrix = Mat3.create();
    }

    updateMatrix() {
        const mat = Mat4.create();
        // scale
        Mat4.scale(mat, mat, this.scale);
        this.matrix = mat;
        // postion
        Mat4.translate(mat, mat, this.position);
        // rotation
        Mat4.fromQuat(this.rotation, this.quaterion);
        Mat4.multiply(mat, mat, this.rotation);
    }

    updateMatrixWorld() {
        this.updateMatrix();
        if (this.parent) {
            this.matrixWorld = Mat4.multiply(new Mat4(), this.parent.matrixWorld, this.matrix) as Mat4;
        } else {
            this.matrixWorld = Mat4.clone(this.matrix);
        }

        // inv
        Mat4.invert(this.matrixWorldInv, this.matrixWorld);
    }
}

class Mesh extends Object3D {
    constructor(public geometry: Geometry, public material: Material) {
        super();
    }
}

class Scene extends Object3D {
    objects: Object3D[] = [];
}

class Camera extends Object3D {
    projectionMatrix: Mat4;
    target: Vec3;
    constructor() {
        super();
        this.projectionMatrix = Mat4.create();
        this.target = Vec3.create();
    }

    lookAt(x, y, z) {
        Vec3.set(this.target, x, y, z);
        const lookAtRotation = Mat4.lookAt(Mat4.create(), this.position, Vec3.fromValues(x, y, z), this.up);
        const lookAtRotationMat3 = Mat3.fromMat4(Mat3.create(), lookAtRotation);
        // lookAtRotation is a viewmatrix, thus it applys to object,
        // but here we are applying to camera itself, so we need invert it.
        Mat3.invert(lookAtRotationMat3, lookAtRotationMat3);
        // and take only left-top corner as rotation matrix
        Quat.fromMat3(this.quaterion, lookAtRotationMat3);
        this.updateMatrixWorld();
    }
}
class PerspectiveCamera extends Camera {
    public zoom = 0.001;
    constructor(public fov = 60, public aspect = 1, public near = 0.1, public far = 100) {
        super();
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        const top = (this.near * Math.tan((this.fov * DEG2RAD) / 2)) / this.zoom;
        const height = 2 * top;
        const width = this.aspect * height;
        const zoomedAspect = width / height;
        const zoomedFov = Math.atan(top / this.near);

        Mat4.perspectiveNO(this.projectionMatrix, zoomedFov, zoomedAspect, this.near, this.far);
    }
}
export {
    Material,
    DeferredMaterial,
    PBRMaterial,
    DeferredDebugMaterial,
    Geometry,
    Object3D,
    Mesh,
    Scene,
    Camera,
    PerspectiveCamera,
};

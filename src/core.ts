import {
    vec3 as Vector3,
    mat3 as Matrix3,
    mat4 as Matrix4,
    quat as Quaterion,
    mat4,
    vec3,
    mat3,
} from "gl-matrix";
import { BufferLayout, StructuredData, TypedArrayCode } from "./util";
import { DEG2RAD } from "./math/math";

class Material {
    constructor(public name: string) {}
}
class PathTracerMaterial extends Material {
    // TODO:
    // static name = "PathTracerMaterial";
    constructor() {
        super("PathTracerMaterial");
    }
}

class PathTracerShader {}

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
    matrix: Matrix4;
    matrixWorld: Matrix4;
    matrixWorldInv: Matrix4;
    position: Vector3;
    rotation: Matrix4;
    quaterion: Quaterion;
    up: Vector3;
    scale: Vector3;

    mvMatrix: Matrix4;
    constructor() {
        this.matrix = Matrix4.create();
        this.matrixWorld = Matrix4.create();
        this.matrixWorldInv = Matrix4.create();
        this.position = Vector3.create();
        this.rotation = Matrix4.create();
        this.quaterion = Quaterion.create();
        this.up = Vector3.fromValues(0, 1, 0);
        this.scale = Vector3.fromValues(1, 1, 1);

        this.mvMatrix = Matrix4.create();
    }

    updateMatrixWorld() {
        const mat = Matrix4.create();
        // scale
        Matrix4.scale(mat, mat, this.scale);
        this.matrixWorld = mat;
        // postion
        Matrix4.translate(mat, mat, this.position);
        // rotation
        Matrix4.fromQuat(this.rotation, this.quaterion);
        Matrix4.multiply(mat, mat, this.rotation);
        // inv
        Matrix4.invert(this.matrixWorldInv, this.matrixWorld);
    }
}

class Mesh extends Object3D {
    constructor(public geometry: Geometry, public material: Material) {
        super();
    }
}

class Camera extends Object3D {
    projectionMatrix: Matrix4;
    constructor() {
        super();
        this.projectionMatrix = Matrix4.create();
    }

    lookAt(x, y, z) {
        const lookAtRotation = Matrix4.lookAt(
            Matrix4.create(),
            this.position,
            Vector3.fromValues(x, y, z),
            this.up
        );
        const lookAtRotationMat3 = Matrix3.fromMat4(Matrix3.create(), lookAtRotation);
        // lookAtRotation is a viewmatrix, thus it applys to object,
        // but here we are applying to camera itself, so we need invert it.
        Matrix3.invert(lookAtRotationMat3, lookAtRotationMat3);
        // and take only left-top corner as rotation matrix
        Quaterion.fromMat3(this.quaterion, lookAtRotationMat3);
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

        Matrix4.perspective(this.projectionMatrix, zoomedFov, zoomedAspect, this.near, this.far);
    }
}
export { Material, PathTracerMaterial, Geometry, Object3D, Mesh, Camera, PerspectiveCamera };

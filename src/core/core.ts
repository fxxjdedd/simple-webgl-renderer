import { Vec3, Mat3, Mat4, Quat } from "gl-matrix";
import { BufferLayout, StructuredData, TypedArrayCode } from "../util";
import { DEG2RAD } from "../math/math";
import { Texture } from "./texture";
import { calcBBox } from "../util/boundary";
import { ObjectSpaceNormalMap } from "../constants";

class Material {
    private _map: Texture;
    private _normalMap: Texture;
    set map(v: Texture) {
        this._map = v;
        this.uniforms["map"] = v;
    }

    get map() {
        return this._map;
    }

    set normalMap(v: Texture) {
        this._normalMap = v;
        this.uniforms["normalMap"] = v;
    }

    get normalMap() {
        return this._normalMap;
    }

    uniforms: Record<string, any> = {};
    constructor(public name: string) {}
}
class Geometry<T extends BufferLayout = BufferLayout> {
    index: number[] | null;
    attributes: Record<keyof T, number[]>;
    bbox: [Vec3, Vec3] | null = null;
    isDirty = true;
    constructor(public layout: T) {
        this.index = null;
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
    centerAligned = true;
    constructor(public geometry: Geometry, public material: Material) {
        super();
    }

    alignToBBoxCenter(bbox?: [Vec3, Vec3]) {
        bbox = bbox || this.geometry.bbox;
        if (bbox != null) {
            const center = new Vec3(
                bbox[0][0] + (bbox[1][0] - bbox[0][0]) / 2,
                bbox[0][1] + (bbox[1][1] - bbox[0][1]) / 2,
                bbox[0][2] + (bbox[1][2] - bbox[0][2]) / 2
            );

            this.position = this.position.sub(center);

            // const mv = new Mat4().translate(new Vec3(-center[0], -center[1], -center[2]));
            // Mat4.multiply(this.matrixWorld, mv, this.matrixWorld);
            // Mat4.invert(this.matrixWorldInv, this.matrixWorld);
            // // this.matrix[4 * 3] -= center[0];
            // // this.matrix[4 * 3 + 1] -= center[1];
            // // this.matrix[4 * 3 + 1] -= center[2];
        }
    }
}

class Scene extends Object3D {
    objects: Object3D[] = [];
    constructor(objects?: Object3D[]) {
        super();
        if (objects) {
            this.objects = objects;
        }
    }
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
export { Material, Geometry, Object3D, Mesh, Scene, Camera, PerspectiveCamera };

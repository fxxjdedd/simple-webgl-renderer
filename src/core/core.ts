import { Vec3, Mat3, Mat4, Quat, Vec4 } from "gl-matrix";
import { BufferLayout, StructuredData, TypedArrayCode } from "../util";
import { DEG2RAD } from "../util/math";
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

    uniforms: Record<string, any> = {
        diffuse: new Vec4(1, 1, 1, 1),
    };
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

    children: Object3D[] = [];

    castShadow = false;
    receiveShadow = false;
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
        this.matrix = mat;

        // scale
        Mat4.scale(mat, mat, this.scale);
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

    alignToBBox(bbox?: [Vec3, Vec3], align: "center" | "bottom" | "top" = "center") {
        bbox = bbox || this.geometry.bbox;
        if (bbox != null) {
            const center = new Vec3(
                bbox[0].x + (bbox[1].x - bbox[0].x) / 2,
                0,
                bbox[0].z + (bbox[1].z - bbox[0].z) / 2
            );
            if (align === "center") {
                center.y = bbox[0].y + (bbox[1].y - bbox[0].y) / 2;
            } else if (align === "bottom") {
                center.y = bbox[0].y;
            } else if (align === "top") {
                center.y = bbox[1].y;
            }

            this.position = this.position.sub(center);
        }
    }
}

class Scene extends Object3D {
    overrideMaterial: Material = null;
    constructor(objects?: Object3D[]) {
        super();
        if (objects) {
            this.children.push(...objects);
        }
    }
}

abstract class Camera extends Object3D {
    near: number;
    far: number;
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

    abstract updateProjectionMatrix(): void;
}
class PerspectiveCamera extends Camera {
    public zoom = 1;
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

class OrthoCamera extends Camera {
    public zoom = 1;
    constructor(
        public left = -1,
        public right = 1,
        public top = 1,
        public bottom = -1,
        public near = 0.1,
        public far = 5
    ) {
        super();
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        const centerX = this.left + (this.right - this.left) / 2.0;
        const centerY = this.bottom + (this.top - this.bottom) / 2.0;

        const offsetX = (this.right - this.left) / 2.0 / this.zoom;
        const offsetY = (this.top - this.bottom) / 2.0 / this.zoom;

        const left = centerX - offsetX;
        const right = centerX + offsetX;
        const bottom = centerY - offsetY;
        const top = centerY + offsetY;

        Mat4.orthoNO(this.projectionMatrix, left, right, bottom, top, this.near, this.far);
    }
}
export { Material, Geometry, Object3D, Mesh, Scene, Camera, PerspectiveCamera, OrthoCamera };

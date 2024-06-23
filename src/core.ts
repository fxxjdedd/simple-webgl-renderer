import { vec3 as Vector3, mat4 as Matrix4, quat as Quaterion } from "gl-matrix";
import { BufferLayout, StructuredData, TypedArrayCode } from "./util";

class Material {}
class PathTracerMaterial extends Material {}

class PathTracerShader {}

class Geometry<T extends BufferLayout = BufferLayout> {
    index: ArrayBufferLike;
    attributes: Record<keyof T, number[]>;
    structuredData: StructuredData<T>;
    constructor(protected layout: T) {
        this.attributes = {} as any;
        this.structuredData = new StructuredData(layout);
    }
    setIndex(indices: number[]) {
        this.index = new Int16Array(indices);
    }

    setAttribute(name: keyof T, attrBuffer: number[]) {
        this.attributes[name] = attrBuffer;
    }

    copyToBuffer() {
        this.structuredData.merge(this.attributes);
    }
}

class Object3D {
    matrix: Matrix4;
    matrixWorld: Matrix4;
    matrixWorldInv: Matrix4;
    position: Vector3;
    rotation: Quaterion;
    scale: Vector3;

    mvMatrix: Matrix4;
    constructor() {
        this.matrix = Matrix4.create();
        this.matrixWorld = Matrix4.create();
        this.matrixWorldInv = Matrix4.create();
        this.position = Vector3.create();
        this.rotation = Quaterion.create();
        this.scale = Vector3.create();

        this.mvMatrix = Matrix4.create();
    }
}

class Mesh extends Object3D {
    geometry: Geometry;
    material: Material;
    constructor(geometry: Geometry, material: Material) {
        super();
        this.geometry = geometry;
        this.material = material;
    }
}

class Camera extends Object3D {
    projectionMatrix: Matrix4;
    constructor() {
        super();
        this.projectionMatrix = Matrix4.create();
    }
}
class PerspectiveCamera extends Camera {
    fov: number;
    aspect: number;
    near: number;
    far: number;
    constructor(fov = 60, aspect = 1, near = 0.1, far = 1000) {
        super();
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
    }
}
export { Material, PathTracerMaterial, Geometry, Object3D, Mesh, Camera, PerspectiveCamera };

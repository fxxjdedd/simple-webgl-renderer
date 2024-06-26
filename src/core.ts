import { vec3 as Vector3, mat4 as Matrix4, quat as Quaterion } from "gl-matrix";
import { BufferLayout, StructuredData, TypedArrayCode } from "./util";

class Material {
    constructor(public name: string) {}
}
class PathTracerMaterial extends Material {
    constructor() {
        super("PathTracerMaterial");
    }
}

class PathTracerShader {}

class Geometry<T extends BufferLayout = BufferLayout> {
    index: number[];
    attributes: Record<keyof T, number[]>;
    structuredData: StructuredData<T>;
    constructor(protected layout: T) {
        this.attributes = {} as any;
        this.structuredData = new StructuredData(layout);
    }
    setIndex(indices: number[]) {
        this.index = indices;
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

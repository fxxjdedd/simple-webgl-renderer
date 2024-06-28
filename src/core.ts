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
    public zoom = 1;
    constructor(public fov = 60, public aspect = 1, public near = 0.1, public far = 1000) {
        super();
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        const top = (this.near * Math.tan(this.fov / 2)) / this.zoom;
        const height = 2 * top;
        const width = this.aspect * height;
        const zoomedAspect = width / height;
        const zoomedFov = Math.atan(top / this.near);

        Matrix4.perspective(this.projectionMatrix, zoomedFov, zoomedAspect, this.near, this.far);
    }
}
export { Material, PathTracerMaterial, Geometry, Object3D, Mesh, Camera, PerspectiveCamera };

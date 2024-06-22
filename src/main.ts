import { vec3 as Vector3, mat4 as Matrix4, quat as Quaterion } from "gl-matrix";
import fragmentShader from "./pathtracer_fragment.glsl";
import vertexShader from "./pathtracer_vertex.glsl";
import { ArrayCodeToType, BufferLayout, StructuredData, TypedArrayCode } from "./util";

class Material {}
class PathTracerMaterial extends Material {}

class PathTracerShader {}

class BufferAttribute {
    constructor(public array: ArrayBufferLike, public itemSize: number) {}
}

class Geometry<T extends BufferLayout = BufferLayout> {
    index: ArrayBufferLike;
    attributes: Record<keyof T, ArrayCodeToType<T[keyof T]["type"]>>;
    structuredData: StructuredData<T>;
    constructor(protected layout: T) {
        this.attributes = {} as any;
        this.structuredData = new StructuredData(layout);
    }
    setIndex(indices: Uint16Array | Uint32Array) {
        this.index = indices;
    }

    setAttribute<TName extends keyof T>(
        name: TName,
        attrBuffer: ArrayCodeToType<T[TName]["type"]>
    ) {
        this.attributes[name] = attrBuffer;
    }

    copyToBuffer() {
        this.structuredData.merge(this.attributes);
    }
}
const BoxGeometryBufferLayout = StructuredData.createLayout({
    position: {
        type: TypedArrayCode.float32,
        components: 3,
    },
    normal: {
        type: TypedArrayCode.float32,
        components: 3,
    },
    uv: {
        type: TypedArrayCode.float32,
        components: 2,
    },
});
new StructuredData(BoxGeometryBufferLayout).merge({
    position: new Float32Array(),
    normal: new Float32Array(),
    uv: new Float32Array(),
});

class BoxGeometry extends Geometry<typeof BoxGeometryBufferLayout> {
    constructor(
        width = 1,
        height = 1,
        depth = 1,
        widthSegments = 1,
        heightSegments = 1,
        depthSegments = 1
    ) {
        super(BoxGeometryBufferLayout);
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        let vertexCountAccumulate = 0;

        const x = 0;
        const y = 1;
        const z = 2;

        // every plane's direction is rt -> lb
        // left plane
        buildPlane(y, z, x, 1, -1, height, depth, -width, heightSegments, depthSegments, 0);
        // right plane
        buildPlane(y, z, x, -1, -1, height, depth, width, heightSegments, depthSegments, 1);
        // forward plane
        buildPlane(x, y, z, -1, -1, width, height, -depth, widthSegments, heightSegments, 2);
        // backward plane
        buildPlane(x, y, z, 1, -1, width, height, depth, widthSegments, heightSegments, 3);
        // top plane
        buildPlane(x, z, y, -1, -1, width, depth, height, widthSegments, depthSegments, 4);
        // bottom plane
        buildPlane(x, z, y, -1, 1, width, depth, -height, widthSegments, depthSegments, 5);

        function buildPlane(
            u,
            v,
            w,
            udir,
            vdir,
            uLength,
            vLength,
            wLength,
            segCountX,
            segCountY,
            materialIndex // TODO
        ) {
            const segWidth = uLength / segCountX;
            const segHeight = vLength / segCountY;
            const halfU = uLength / 2;
            const halfV = vLength / 2;
            const halfW = wLength / 2;

            const segCountX1 = segCountX + 1;
            const segCountY1 = segCountY + 1;

            const vec = Vector3.create();

            for (let iy = 0; iy < segCountY1; iy++) {
                const y = segHeight * iy - halfV;
                for (let ix = 0; ix < segCountX1; ix++) {
                    const x = segWidth * ix - halfU;
                    vec[u] = udir * x;
                    vec[v] = vdir * y;
                    vec[w] = halfW;

                    vertices.push(vec[0], vec[1], vec[2]);

                    vec[u] = 0;
                    vec[v] = 0;
                    vec[w] = wLength > 0 ? 1 : -1;

                    normals.push(vec[0], vec[1], vec[2]);

                    uvs.push(ix / segCountX);
                    uvs.push(1 - iy / segCountY);

                    vertexCountAccumulate += 1;
                }
            }

            for (let iy = 0; iy < segCountY; iy++) {
                for (let ix = 0; ix < segCountX; ix++) {
                    const lt = vertexCountAccumulate + ix + iy * segCountX;
                    const rt = vertexCountAccumulate + ix + 1 + iy * segCountX;
                    const rb = vertexCountAccumulate + ix + 1 + segCountX + iy * segCountX;
                    const lb = vertexCountAccumulate + ix + segCountX + iy * segCountX;

                    indices.push(lt, rt, rb);
                    indices.push(rb, lb, lt);
                }
            }
        }

        this.setIndex(new Uint16Array(indices));
        this.setAttribute("position", new Float32Array(vertices));
        this.setAttribute("normal", new Float32Array(normals));
        this.setAttribute("uv", new Float32Array(uvs));
        this.copyToBuffer();
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

class WebGLProgram {
    program: globalThis.WebGLProgram;

    constructor(public gl: WebGLRenderingContext) {
        const program = gl.createProgram();

        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vertexShader);
        gl.compileShader(vs);

        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(vs));
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fragmentShader);
        gl.compileShader(fs);

        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(fs));
        }

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }
        this.program = program;
    }

    setUniformWithSetter(name, value, setter) {
        const addr = this.gl.getUniformLocation(this.program, name);
        setter(addr, value);
    }
}

class WebGLRenderer {
    ctx: WebGLRenderingContext;
    program: WebGLProgram;
    constructor(canvas: HTMLCanvasElement) {
        const gl = (this.ctx = canvas.getContext("webgl"));
        this.program = new WebGLProgram(gl);
    }
    render(mesh: Mesh, camera: Camera) {
        const gl = this.ctx;
        Matrix4.multiply(mesh.mvMatrix, camera.matrixWorldInv, mesh.matrixWorld);
        // prettier-ignore
        this.program.setUniformWithSetter("u_projMatrix", camera.projectionMatrix, gl.uniformMatrix4fv);
        this.program.setUniformWithSetter("u_mvMatrix", mesh.mvMatrix, gl.uniformMatrix4fv);

        mesh.geometry;
    }
}

const renderer = new WebGLRenderer(document.getElementById("webglcanvas") as HTMLCanvasElement);

const pathtracerMat = new PathTracerMaterial();
const box = new BoxGeometry();
const boxMesh = new Mesh(box, pathtracerMat);
const camera = new PerspectiveCamera();

function animate() {
    renderer.render(boxMesh, camera);
    requestAnimationFrame(() => {
        animate();
    });
}

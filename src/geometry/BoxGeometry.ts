import { Vec3, Mat4, Quat } from "gl-matrix";
import { Geometry } from "../core";
import { StructuredData, TypedArrayCode } from "../util";

export const BoxGeometryBufferLayout = StructuredData.createLayout({
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

export class BoxGeometry extends Geometry<typeof BoxGeometryBufferLayout> {
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
        buildPlane(y, z, x, -1, 1, height, depth, -width, heightSegments, depthSegments, 0);
        // right plane
        buildPlane(y, z, x, -1, -1, height, depth, width, heightSegments, depthSegments, 1);
        // forward plane
        buildPlane(x, y, z, -1, -1, width, height, -depth, widthSegments, heightSegments, 2);
        // backward plane
        buildPlane(x, y, z, -1, 1, width, height, depth, widthSegments, heightSegments, 3);
        // top plane
        buildPlane(x, z, y, 1, 1, width, depth, height, widthSegments, depthSegments, 4);
        // bottom plane
        buildPlane(x, z, y, 1, -1, width, depth, -height, widthSegments, depthSegments, 5);

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

            const vec = Vec3.create();

            let currentAccumulate = vertexCountAccumulate;

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
                    const lt = currentAccumulate + ix + iy * segCountX1;
                    const lb = currentAccumulate + ix + (iy + 1) * segCountX1;
                    const rb = currentAccumulate + ix + 1 + (iy + 1) * segCountX1;
                    const rt = currentAccumulate + ix + 1 + iy * segCountX1;

                    indices.push(lt, lb, rt);
                    indices.push(lb, rb, rt);
                }
            }
        }

        this.setIndex(indices);
        this.setAttribute("position", vertices);
        this.setAttribute("normal", normals);
        this.setAttribute("uv", uvs);
    }
}

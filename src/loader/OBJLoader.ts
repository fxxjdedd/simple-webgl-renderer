import { Vec3, Vec3Like } from "gl-matrix";
import { Geometry, Group, Mesh } from "../core/core";
import { StructuredData, TypedArrayCode } from "../util";
import { Loader } from "./Loader";
import { PBRMaterial } from "../materials";

const separator = /\s{1,2}/g;
const bufferLayout = StructuredData.createLayout({
    position: {
        type: TypedArrayCode.float32,
        components: 3,
    },
    uv: {
        type: TypedArrayCode.float32,
        components: 2,
    },
    normal: {
        type: TypedArrayCode.float32,
        components: 3,
    },
});
export class OBJLoader extends Loader<Group> {
    public load(url: string) {
        const container = new Group();
        fetch(url).then(async (resp) => {
            const content = await resp.text();
            const contentLines = content.split(/\n/g);

            const objects: { name: string; geometry: Geometry }[] = [];

            const bboxMin = new Vec3([Infinity, Infinity, Infinity]);
            const bboxMax = new Vec3([-Infinity, -Infinity, -Infinity]);

            let parser: ReturnType<typeof this.createObjGeometryParser>;
            let lineNum = 0;
            let offsets = { position: 0, normal: 0, uv: 0 };
            for (let line of contentLines) {
                lineNum += 1;
                line = line.trim();
                const parts = line.split(separator);
                if (parts[0] === "o") {
                    if (parser !== undefined) {
                        const result = parser.getResult();
                        objects.push(result);
                        offsets.position += result.source.v.length / 3;
                        offsets.normal += result.source.vn.length / 3;
                        offsets.uv += result.source.vt.length / 2;
                    }

                    parser = this.createObjGeometryParser(parts[1], offsets);
                    continue;
                }

                if (!parser) {
                    parser = this.createObjGeometryParser("", offsets);
                }
                parser.readLine(line);
            }
            objects.push(parser.getResult());

            for (const obj of objects) {
                const pbrMaterial = new PBRMaterial();
                pbrMaterial.uniforms.metalness = 0.0;
                pbrMaterial.uniforms.roughness = 1.0;
                const mesh = new Mesh(obj.geometry, pbrMaterial);
                mesh.name = obj.name;

                bboxMin.x = Math.min(bboxMin.x, obj.geometry.bbox[0].x);
                bboxMin.y = Math.min(bboxMin.y, obj.geometry.bbox[0].y);
                bboxMin.z = Math.min(bboxMin.z, obj.geometry.bbox[0].z);

                bboxMax.x = Math.max(bboxMax.x, obj.geometry.bbox[1].x);
                bboxMax.y = Math.max(bboxMax.y, obj.geometry.bbox[1].y);
                bboxMax.z = Math.max(bboxMax.z, obj.geometry.bbox[1].z);

                container.add(mesh);
            }

            container.alignToBBox([bboxMin, bboxMax], "bottom");

            this.emit("loader:load", container);
        });

        return container;
    }

    private createObjGeometryParser(objectName: string, offsets: { position: number; normal: number; uv: number }) {
        const source = {
            v: [],
            vn: [],
            vt: [],
        };

        const geometry = {
            position: [],
            normal: [],
            uv: [],
            indices: null, // current we dont need indices
        };

        const bboxMin = [Infinity, Infinity, Infinity];
        const bboxMax = [-Infinity, -Infinity, -Infinity];

        function readLine(line) {
            const parts = line.trim().split(separator);

            const firstChar = parts[0]?.[0];

            if (firstChar === "v") {
                switch (parts[0]) {
                    case "v":
                        const pos = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
                        bboxMin[0] = Math.min(bboxMin[0], pos[0]);
                        bboxMin[1] = Math.min(bboxMin[1], pos[1]);
                        bboxMin[2] = Math.min(bboxMin[2], pos[2]);
                        bboxMax[0] = Math.max(bboxMax[0], pos[0]);
                        bboxMax[1] = Math.max(bboxMax[1], pos[1]);
                        bboxMax[2] = Math.max(bboxMax[2], pos[2]);

                        source.v.push(...pos);
                        break;
                    case "vn":
                        source.vn.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                        break;
                    case "vt":
                        source.vt.push(parseFloat(parts[1]), parseFloat(parts[2]));
                        break;
                }
            } else if (firstChar === "f") {
                const v1 = parts[1].split(/\//g).map((d) => parseFloat(d));

                for (let i = 2; i < parts.length - 1; i++) {
                    const v2 = parts[i].split(/\//g).map((d) => parseFloat(d));
                    const v3 = parts[i + 1].split(/\//g).map((d) => parseFloat(d));

                    const i1 = v1[0] - 1 - offsets.position;
                    const i2 = v2[0] - 1 - offsets.position;
                    const i3 = v3[0] - 1 - offsets.position;

                    const posA = source.v.slice(i1 * 3, i1 * 3 + 3);
                    const posB = source.v.slice(i2 * 3, i2 * 3 + 3);
                    const posC = source.v.slice(i3 * 3, i3 * 3 + 3);

                    geometry.position.push(...posA);
                    geometry.position.push(...posB);
                    geometry.position.push(...posC);

                    if (v1[1] && v2[1] && v3[1]) {
                        const t1 = v1[1] - 1 - offsets.uv;
                        const t2 = v2[1] - 1 - offsets.uv;
                        const t3 = v3[1] - 1 - offsets.uv;

                        geometry.uv.push(...source.vt.slice(t1 * 2, t1 * 2 + 2));
                        geometry.uv.push(...source.vt.slice(t2 * 2, t2 * 2 + 2));
                        geometry.uv.push(...source.vt.slice(t3 * 2, t3 * 2 + 2));
                    } else {
                        geometry.uv.push(0, 0);
                        geometry.uv.push(0, 0);
                        geometry.uv.push(0, 0);
                    }

                    if (v1[2] && v2[2] && v3[2]) {
                        const n1 = v1[2] - 1 - offsets.normal;
                        const n2 = v2[2] - 1 - offsets.normal;
                        const n3 = v3[2] - 1 - offsets.normal;
                        geometry.normal.push(...source.vn.slice(n1 * 3, n1 * 3 + 3));
                        geometry.normal.push(...source.vn.slice(n2 * 3, n2 * 3 + 3));
                        geometry.normal.push(...source.vn.slice(n3 * 3, n3 * 3 + 3));
                    } else {
                        const ab = [posB[0] - posA[0], posB[1] - posA[1], posB[2] - posA[2]] as Vec3Like;
                        const ac = [posC[0] - posA[0], posC[1] - posA[1], posC[2] - posA[2]] as Vec3Like;

                        const crs = new Vec3(ab);
                        Vec3.cross(crs, ab, ac);
                        const normal = crs.normalize();

                        geometry.normal.push(...normal);
                        geometry.normal.push(...normal);
                        geometry.normal.push(...normal);
                    }
                }
            }
        }

        function getResult() {
            const bufferGeometry = new Geometry(bufferLayout);

            bufferGeometry.setAttribute("position", geometry.position);
            bufferGeometry.setAttribute("normal", geometry.normal);
            bufferGeometry.setAttribute("uv", geometry.uv);
            bufferGeometry.bbox = [new Vec3(...bboxMin), new Vec3(...bboxMax)] as [Vec3, Vec3];
            bufferGeometry.isDirty = true;

            return {
                geometry: bufferGeometry,
                name: objectName,
                source,
            };
        }

        return {
            readLine,
            getResult,
        };
    }
}

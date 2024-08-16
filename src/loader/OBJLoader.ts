import { Vec3 } from "gl-matrix";
import { Geometry } from "../core/core";
import { StructuredData, TypedArrayCode } from "../util";

// 分隔符
const separator = /\s{1,2}/g;

export class OBJLoader {
    public load(url: string) {
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

        const geometry = new Geometry(bufferLayout);

        geometry.setAttribute("position", []);
        geometry.setAttribute("normal", []);
        geometry.setAttribute("uv", []);

        fetch(url).then(async (resp) => {
            const content = await resp.text();
            const {
                geometry: { position, normal, uv, indices },
                bbox,
            } = this.parseObjGeometry(content);

            geometry.setAttribute("position", position);
            geometry.setAttribute("normal", normal);
            geometry.setAttribute("uv", uv);
            geometry.setIndex(indices);
            geometry.bbox = bbox;
            geometry.isDirty = true;
        });

        return geometry;
    }

    private parseObjGeometry(content) {
        const source = {
            v: [],
            vn: [],
            vt: [],
        };

        const geometry = {
            position: source.v,
            normal: [],
            uv: [],
            indices: [],
        };

        const bboxMin = [Infinity, Infinity, Infinity];
        const bboxMax = [-Infinity, -Infinity, -Infinity];

        const lines = content.split(/\n/g);

        function setArrayRange(arr1, start, arr2, start2, count) {
            for (let i = 0, j = start2; j < start2 + count; i++, j++) {
                arr1[start + i] = arr2[j];
            }
        }

        for (let line of lines) {
            line = line.trim();
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
                        geometry.normal.length += 3;
                        geometry.uv.length += 2;
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

                    const i1 = v1[0] - 1;
                    const i2 = v2[0] - 1;
                    const i3 = v3[0] - 1;
                    geometry.indices.push(i1, i2, i3);

                    if (v1[1] && v2[1] && v3[1]) {
                        setArrayRange(geometry.uv, i1 * 2, source.vt, v1[1] * 2, 2);
                        setArrayRange(geometry.uv, i2 * 2, source.vt, v2[1] * 2, 2);
                        setArrayRange(geometry.uv, i3 * 2, source.vt, v3[1] * 2, 2);
                    } else {
                        setArrayRange(geometry.uv, i1 * 2, [0, 0], 0, 2);
                        setArrayRange(geometry.uv, i2 * 2, [0, 0], 0, 2);
                        setArrayRange(geometry.uv, i3 * 2, [0, 0], 0, 2);
                    }

                    if (v1[2] && v2[2] && v3[2]) {
                        setArrayRange(geometry.normal, i1 * 3, source.vn, v1[2] * 3, 3);
                        setArrayRange(geometry.normal, i2 * 3, source.vn, v2[2] * 3, 3);
                        setArrayRange(geometry.normal, i3 * 3, source.vn, v3[2] * 3, 3);
                    } else {
                        const a = new Vec3(
                            geometry.position[i1 * 3],
                            geometry.position[i1 * 3 + 1],
                            geometry.position[i1 * 3 + 2]
                        );

                        const b = new Vec3(
                            geometry.position[i2 * 3],
                            geometry.position[i2 * 3 + 1],
                            geometry.position[i2 * 3 + 2]
                        );

                        const c = new Vec3(
                            geometry.position[i3 * 3],
                            geometry.position[i3 * 3 + 1],
                            geometry.position[i3 * 3 + 2]
                        );

                        const ab = new Vec3().copy(b).sub(a);
                        const ac = new Vec3().copy(c).sub(a);

                        Vec3.cross(ac, ab, ac);
                        const normal = ac.normalize();

                        setArrayRange(geometry.normal, i1 * 3, normal, 0, 3);
                        setArrayRange(geometry.normal, i2 * 3, normal, 0, 3);
                        setArrayRange(geometry.normal, i3 * 3, normal, 0, 3);
                    }
                }
            }
        }

        return { geometry, bbox: [new Vec3(...bboxMin), new Vec3(...bboxMax)] as [Vec3, Vec3] };
    }
}

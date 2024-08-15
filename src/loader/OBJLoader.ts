import { Geometry } from "../core/core";
import { StructuredData, TypedArrayCode } from "../util";

export class OBJLoader {
    public load(url: string) {
        const bufferLayout = StructuredData.createLayout({
            position: {
                type: TypedArrayCode.float32,
                components: 3,
            },
            normal: {
                type: TypedArrayCode.float32,
                components: 3,
            },
        });

        const geometry = new Geometry(bufferLayout);

        fetch(url).then(async (resp) => {
            const content = await resp.text();

            const positions = [];
            const normals = [];
            const indices = [];

            const vertices = [];
            const vertexNormals = [];

            const lines = content.split(/\n/g);
        });

        return geometry;
    }
}

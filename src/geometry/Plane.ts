import { Geometry } from "../core/core";
import { StructuredData, TypedArrayCode } from "../util";

const planeLayout = StructuredData.createLayout({
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
export class Plane extends Geometry<typeof planeLayout> {
    constructor() {
        super(planeLayout);

        // prettier-ignore
        this.setAttribute("position", [
            -1, 0, -1,
            1, 0, -1,
            1, 0, 1,
            -1, 0, 1,
        ]);

        // prettier-ignore
        this.setAttribute("normal", [
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
        ]);

        // prettier-ignore
        this.setAttribute("uv", [
            0, 0,
            1, 0,
            1, 1,
            0, 1,
        ]);
        // must counter-clockwise
        this.setIndex([0, 2, 1, 0, 3, 2]);
    }
}

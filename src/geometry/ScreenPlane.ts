import { Geometry } from "../core/core";
import { StructuredData, TypedArrayCode } from "../util";

export class ScreenPlane extends Geometry {
    constructor() {
        super(
            StructuredData.createLayout({
                position: {
                    type: TypedArrayCode.float32,
                    components: 3,
                },
            })
        );

        // prettier-ignore
        this.setAttribute("position", [
            -1, -1, -1,
            1, -1, -1,
            1, 1, -1,
            -1, 1, -1 
        ]);

        this.setIndex([0, 1, 2, 0, 2, 3]);
    }
}

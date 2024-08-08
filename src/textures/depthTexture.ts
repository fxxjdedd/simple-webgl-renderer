import { ClampToEdgeWrapping, DepthFormat, NearestFilter, UnsignedIntType } from "../constants";
import { Texture } from "../core/texture";

export class DepthTexture extends Texture {
    constructor(gl: WebGL2RenderingContext) {
        super(
            {
                width: 0,
                height: 0,
            },
            {
                wrapS: ClampToEdgeWrapping,
                wrapT: ClampToEdgeWrapping,
                // must use nearest
                // https://stackoverflow.com/questions/17707638/getting-black-color-from-depth-buffer-in-open-gl-es-2-0
                magFilter: NearestFilter,
                minFilter: NearestFilter,
                format: DepthFormat,
                type: UnsignedIntType,
            }
        );
        this.isDepthTexture = true;
    }
}

import { Texture } from "../core/texture";

export class DepthTexture extends Texture {
    constructor(gl: WebGL2RenderingContext) {
        super(
            {
                width: 0,
                height: 0,
            },
            {
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                // must use nearest
                // https://stackoverflow.com/questions/17707638/getting-black-color-from-depth-buffer-in-open-gl-es-2-0
                magFilter: gl.NEAREST,
                minFilter: gl.NEAREST,
                format: gl.DEPTH_COMPONENT,
                type: gl.UNSIGNED_INT,
            }
        );
        this.isDepthTexture = true;
    }
}

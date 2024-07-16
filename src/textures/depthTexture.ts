import { GL_Texture } from "../gl/glTexture";

export class DepthTexture extends GL_Texture {
    constructor(gl: WebGL2RenderingContext) {
        super(
            {
                width: 512,
                height: 512,
            },
            {
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                magFilter: gl.LINEAR,
                minFilter: gl.LINEAR,
                format: gl.RGBA,
                type: gl.UNSIGNED_SHORT,
            }
        );
    }
}

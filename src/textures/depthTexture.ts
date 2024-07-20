import { GL_Texture } from "../gl/glTexture";

export class DepthTexture extends GL_Texture {
    constructor(gl: WebGL2RenderingContext) {
        super(
            {
                width: 0,
                height: 0,
            },
            {
                wrapS: gl.CLAMP_TO_EDGE,
                wrapT: gl.CLAMP_TO_EDGE,
                magFilter: gl.LINEAR,
                minFilter: gl.LINEAR,
                format: gl.DEPTH_COMPONENT,
                type: gl.UNSIGNED_INT,
            }
        );
        this.isDepthTexture = true;
    }
}

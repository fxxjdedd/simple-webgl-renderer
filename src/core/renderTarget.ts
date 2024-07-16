import { GL_FrameBuffer } from "../gl/glFrameBuffer";
import { GL_State } from "../gl/glState";
import { GL_Texture, GL_TextureParam } from "../gl/glTexture";

type RenderTargetOptions = GL_TextureParam & {
    enableDepthBuffer: boolean;
    depthTexture: GL_Texture;
    colorsCount: number;
};

export class WebGLRenderTarget {
    framebuffer: GL_FrameBuffer;

    constructor(public width: number, public height: number, public options: RenderTargetOptions) {}

    setupRenderTarget(gl: WebGL2RenderingContext, state: GL_State) {
        if (!this.framebuffer) {
            this.framebuffer = new GL_FrameBuffer(gl, state);
        }

        for (let i = 0; i < this.options.colorsCount; i++) {
            this.framebuffer.addColorTexture(this.width, this.height, this.options);
        }

        if (this.options.enableDepthBuffer) {
            this.framebuffer.enableDepthBuffer(this);
        }

        if (this.options.depthTexture) {
            this.framebuffer.setDepthTexture(this.options.depthTexture);
        }
    }
}

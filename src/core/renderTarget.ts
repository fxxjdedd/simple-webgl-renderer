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
    textures: GL_Texture[] = [];

    get depthTexture() {
        return this.framebuffer.depthTexture;
    }

    constructor(public width: number, public height: number, public options: RenderTargetOptions) {
        for (let i = 0; i < this.options.colorsCount; i++) {
            this.textures.push(new GL_Texture({ width, height }, options));
        }
    }

    setupRenderTarget(gl: WebGL2RenderingContext, state: GL_State) {
        if (!this.framebuffer) {
            this.framebuffer = new GL_FrameBuffer(gl, state);
        }

        this.textures.map((tex) => {
            this.framebuffer.addColorTexture(tex);
        });

        if (this.options.enableDepthBuffer) {
            this.framebuffer.enableDepthBuffer(this);
        }

        if (this.options.depthTexture) {
            this.options.depthTexture.image.width = this.width;
            this.options.depthTexture.image.height = this.height;
            this.framebuffer.setDepthTexture(this.options.depthTexture);
        }
    }
}

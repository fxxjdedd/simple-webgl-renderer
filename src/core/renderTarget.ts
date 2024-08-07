import { GL_FrameBuffer } from "../gl/glFrameBuffer";
import { GL_State } from "../gl/glState";
import { GL_Textures } from "../gl/glTextures";
import { Texture, TextureParam } from "./texture";

type RenderTargetOptions = TextureParam & {
    enableDepthBuffer: boolean;
    depthTexture: Texture;
    colorsCount: number;
};

export class WebGLRenderTarget {
    framebuffer: GL_FrameBuffer;
    textures: Texture[] = [];

    get depthTexture() {
        return this.framebuffer.depthTexture;
    }

    constructor(public width: number, public height: number, public options: RenderTargetOptions) {
        for (let i = 0; i < this.options.colorsCount; i++) {
            const texture = new Texture({ width, height }, options);
            texture.isRenderTargetTexture = true;
            this.textures.push(texture);
        }
    }

    setupRenderTarget(gl: WebGL2RenderingContext, textures: GL_Textures) {
        if (!this.framebuffer) {
            this.framebuffer = new GL_FrameBuffer(gl, textures.state, textures);
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

import { GL_FrameBuffer } from "../gl/glFrameBuffer";
import { GL_Textures } from "../gl/glTextures";
import { Texture, TextureParam } from "./texture";

type RenderTargetOptions = Partial<TextureParam> & {
    enableDepthBuffer: boolean;
    depthTexture: Texture;
    colorsCount: number;
};

export class WebGLRenderTarget {
    framebuffer: GL_FrameBuffer;
    textures: Texture[] = [];

    get texture() {
        return this.textures[0];
    }

    get depthTexture() {
        return this.framebuffer.depthTexture;
    }

    constructor(public width: number, public height: number, public options?: RenderTargetOptions) {
        this.options = {
            colorsCount: 1,
            enableDepthBuffer: false,
            depthTexture: null,
            ...options,
        };
        for (let i = 0; i < this.options.colorsCount; i++) {
            const { enableDepthBuffer, depthTexture, colorsCount, ...textureParam } = this.options;
            const texture = new Texture({ width, height }, textureParam);
            texture.isRenderTargetTexture = true;
            this.textures.push(texture);
        }
    }

    setupRenderTarget(gl: WebGL2RenderingContext, glTextures: GL_Textures) {
        if (!this.framebuffer) {
            this.framebuffer = new GL_FrameBuffer(gl, glTextures.state, glTextures);
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

import { WebGLRenderTarget } from "../core/renderTarget";
import { Texture } from "../core/texture";
import { GL_State } from "./glState";
import { GL_Textures } from "./glTextures";

export class GL_FrameBuffer {
    depthTexture: Texture;
    colorTextures: Texture[] = [];
    fbo: WebGLFramebuffer;
    depthBuffer: WebGLRenderbuffer;
    constructor(private gl: WebGL2RenderingContext, private state: GL_State, private textures: GL_Textures) {
        this.fbo = gl.createFramebuffer();
    }

    addColorTexture(texture: Texture) {
        const gl = this.gl;
        const state = this.state;

        if (!this.colorTextures.includes(texture)) {
            this.colorTextures.push(texture);
            this.textures.initTexture(texture);
        }

        const texLocation = this.textures.getTextureLocation(texture);

        const attachCount = this.colorTextures.length - 1;

        state.bindFrameBuffer(this);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + attachCount, gl.TEXTURE_2D, texLocation, 0);

        state.bindFrameBuffer(null);
        return texture;
    }

    enableDepthBuffer(renderTarget: WebGLRenderTarget) {
        const gl = this.gl;
        const state = this.state;
        if (!this.depthBuffer) {
            this.depthBuffer = gl.createRenderbuffer();
        }

        state.bindFrameBuffer(this);

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, renderTarget.width, renderTarget.height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);

        state.bindFrameBuffer(null);
    }

    setDepthTexture(texture: Texture) {
        const gl = this.gl;
        const state = this.state;

        // texture.init(gl);

        if (this.depthTexture !== texture) {
            this.depthTexture = texture;
            this.textures.initTexture(texture);
        }

        const texLocation = this.textures.getTextureLocation(texture);

        state.bindFrameBuffer(this);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texLocation, 0);

        state.bindFrameBuffer(null);
        state.bindTexture(0, null);
    }
}

import { WebGLRenderTarget } from "../core/renderTarget";
import { GL_State } from "./glState";
import { GL_Texture, GL_TextureParam } from "./glTexture";

export class GL_FrameBuffer {
    depthTexture: GL_Texture;
    colorTextures = [];
    fbo: WebGLFramebuffer;
    depthBuffer: WebGLRenderbuffer;
    constructor(private gl: WebGL2RenderingContext, private state: GL_State) {
        this.fbo = gl.createFramebuffer();
    }

    addColorTexture(texture: GL_Texture) {
        const gl = this.gl;
        const state = this.state;

        if (!this.colorTextures.includes(texture)) {
            texture.init(gl);
            this.colorTextures.push(texture);
        }

        state.bindTexture(texture);

        const attachCount = this.colorTextures.length - 1;

        state.bindFrameBuffer(this);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + attachCount, gl.TEXTURE_2D, texture.texture, 0);

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

    setDepthTexture(texture: GL_Texture) {
        const gl = this.gl;
        const state = this.state;

        texture.init(gl);

        this.depthTexture = texture;

        state.bindTexture(texture);
        state.bindFrameBuffer(this);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture.texture, 0);

        state.bindFrameBuffer(null);
        state.bindTexture(null);
    }
}

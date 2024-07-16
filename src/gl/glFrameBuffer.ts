import { WebGLRenderTarget } from "../core/renderTarget";
import { GL_State } from "./glState";
import { GL_Texture, GL_TextureParam } from "./glTexture";

export class GL_FrameBuffer {
    colorTextures: GL_Texture[];
    depthTexture: GL_Texture;

    fbo: WebGLFramebuffer;
    depthBuffer: WebGLRenderbuffer;
    constructor(private gl: WebGL2RenderingContext, private state: GL_State) {
        this.fbo = gl.createFramebuffer();
    }

    addColorTexture(width: number, height: number, param: GL_TextureParam) {
        const state = this.state;
        const texture = new GL_Texture({ width, height }, param);
        state.bindTexture(texture);
        this.colorTextures.push(texture);
        return texture;
    }

    enableDepthBuffer(renderTarget: WebGLRenderTarget) {
        const gl = this.gl;
        const state = this.state;
        if (this.depthBuffer) return;

        state.bindFrameBuffer(this);

        this.depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, renderTarget.width, renderTarget.height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);

        state.bindFrameBuffer(null);
    }

    setDepthTexture(texture: GL_Texture) {
        const gl = this.gl;
        const state = this.state;

        texture.initGL(gl);
        this.depthTexture = texture;

        state.bindTexture(texture);
        state.bindFrameBuffer(this);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture.texture, 0);

        state.bindFrameBuffer(null);
        state.bindTexture(null);
    }
}

import { WebGLRenderTarget } from "../core/renderTarget";
import { GL_FrameBuffer } from "./glFrameBuffer";
import { GL_Texture } from "./glTexture";

// only change webgl state here
export class GL_State {
    constructor(private gl: WebGL2RenderingContext) {}

    bindTexture(texture: GL_Texture | null) {
        const gl = this.gl;
        if (texture) {
            this.gl.bindTexture(gl.TEXTURE_2D, texture.texture);
        } else {
            this.gl.bindTexture(gl.TEXTURE_2D, 0);
        }
    }

    bindFrameBuffer(framebuffer: GL_FrameBuffer | null) {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer ? framebuffer.fbo : 0);
    }

    drawBuffers(renderTarget: WebGLRenderTarget, framebuffer: GL_FrameBuffer) {
        const gl = this.gl;
    }
}

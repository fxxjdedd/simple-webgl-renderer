import { WebGLRenderTarget } from "../core/renderTarget";
import { Texture } from "../core/texture";
import { GL_FrameBuffer } from "./glFrameBuffer";
import { GL_Textures } from "./glTextures";

// only change webgl state here
export class GL_State {
    constructor(private gl: WebGL2RenderingContext) {}

    bindTexture(unit: number, texture: WebGLTexture) {
        const gl = this.gl;
        this.gl.activeTexture(gl.TEXTURE0 + unit);
        this.gl.bindTexture(gl.TEXTURE_2D, texture);
    }

    bindFrameBuffer(framebuffer: GL_FrameBuffer) {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer ? framebuffer.fbo : null);
    }

    drawBuffers(renderTarget: WebGLRenderTarget) {
        const gl = this.gl;
        if (renderTarget !== null) {
            const framebuffer = renderTarget.framebuffer;
            const attaches = framebuffer.colorTextures.map((_, i) => {
                return gl.COLOR_ATTACHMENT0 + i;
            });
            gl.drawBuffers(attaches);
        } else {
            gl.drawBuffers([gl.BACK]);
        }
    }
}

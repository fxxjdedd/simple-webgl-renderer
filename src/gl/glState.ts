import { WebGLRenderTarget } from "../core/renderTarget";
import { GL_FrameBuffer } from "./glFrameBuffer";
import { GL_Texture } from "./glTexture";

// only change webgl state here
export class GL_State {
    constructor(private gl: WebGL2RenderingContext) {}

    bindTexture(texture: GL_Texture) {
        const gl = this.gl;
        if (texture !== null) {
            this.gl.activeTexture(gl.TEXTURE0 + texture.unit);
            this.gl.bindTexture(gl.TEXTURE_2D, texture.texture);
        } else {
            this.gl.activeTexture(gl.TEXTURE0);
            this.gl.bindTexture(gl.TEXTURE_2D, null);
        }
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

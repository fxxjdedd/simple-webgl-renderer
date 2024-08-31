import { WebGLRenderTarget } from "../core/renderTarget";
import { GL_FrameBuffer } from "./glFrameBuffer";

// only change webgl state here
export class GL_State {
    constructor(private gl: WebGL2RenderingContext) {
        this.gl.clearColor(0, 0, 0, 1);
        // NOTE: depth is not linear, see: https://learnopengl.com/Advanced-OpenGL/Depth-testing
        this.gl.clearDepth(1);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.CULL_FACE);
    }

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

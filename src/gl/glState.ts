import { Material } from "../core/core";
import { WebGLRenderTarget } from "../core/renderTarget";
import { GL_ConstantsMapping } from "./glConstantsMapping";
import { GL_FrameBuffer } from "./glFrameBuffer";

// only change webgl state here
export class GL_State {
    constructor(private gl: WebGL2RenderingContext, private constantsMapping: GL_ConstantsMapping) {
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

    setMaterial(material: Material) {
        const gl = this.gl;

        // TODO: consider transparent
        if (material.blending != null && material.blending.enabled) {
            let { blendDst, blendDstAlpha, blendEquation, blendEquationAlpha, blendSrc, blendSrcAlpha } =
                material.blending;

            blendSrcAlpha = blendSrcAlpha || blendSrc;
            blendDstAlpha = blendDstAlpha || blendDst;
            blendEquationAlpha = blendEquationAlpha || blendEquation;

            const mapping = this.constantsMapping;

            gl.enable(gl.BLEND);
            gl.blendEquationSeparate(mapping.getGLConstant(blendEquation), mapping.getGLConstant(blendEquationAlpha));
            gl.blendFuncSeparate(
                mapping.getGLConstant(blendSrc),
                mapping.getGLConstant(blendDst),
                mapping.getGLConstant(blendSrcAlpha),
                mapping.getGLConstant(blendDstAlpha)
            );
        } else {
            gl.disable(gl.BLEND);
        }
    }
}

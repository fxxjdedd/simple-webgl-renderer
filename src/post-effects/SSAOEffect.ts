import { Vec3 } from "gl-matrix";
import { WebGLRenderTarget } from "../core/renderTarget";
import { WebGLRenderer } from "../core/renderer";
import { lerp } from "../util/math";
import { Camera, Scene } from "../core/core";
import { ShaderMaterial } from "../materials/ShaderMaterial";
import * as ssaoShader from "../shader/post-effects/ssao";

export class SSAOEffect {
    kernel: Vec3[];

    ssaoRenderTarget: WebGLRenderTarget;
    blurRenderTarget: WebGLRenderTarget;

    ssaoMaterial: ShaderMaterial;
    blurMaterial: ShaderMaterial;

    constructor(
        private camera: Camera,
        private gBufferRTT: WebGLRenderTarget,
        private width: number,
        private height: number,
        private kernelSize = 32
    ) {
        this.kernel = this.generateSamplerKernel(this.kernelSize);

        this.ssaoRenderTarget = new WebGLRenderTarget(this.width, this.height);
        this.blurRenderTarget = new WebGLRenderTarget(this.width, this.height);

        this.ssaoMaterial = new ShaderMaterial({
            vertexShader: ssaoShader.vertex,
            fragmentShader: ssaoShader.fragment,
            defines: ssaoShader.getDefines(),
            uniforms: ssaoShader.getUniforms(),
        });

        this.ssaoMaterial.uniforms["kernel"].value = this.kernel;
        this.ssaoMaterial.uniforms["g_diffuse"] = gBufferRTT.texture[0];
        this.ssaoMaterial.uniforms["g_normal"] = gBufferRTT.texture[1];
        this.ssaoMaterial.uniforms["g_depth"] = gBufferRTT.texture[2];

        this.blurMaterial = new ShaderMaterial({
            vertexShader: "",
            fragmentShader: "",
        });
    }
    render(renderer: WebGLRenderer) {
        // sampler kernel
    }

    private generateSamplerKernel(kernelSize: number) {
        const kernel: Vec3[] = [];
        for (let i = 0; i < kernelSize; i++) {
            // hemisphere coords in tangent space
            const x = Math.random() * 2 - 1;
            const y = Math.random() * 2 - 1;
            const z = Math.random();

            const sampleDir = new Vec3(x, y, z);
            sampleDir.normalize();

            let scale = 1 / kernelSize;
            scale *= scale;
            const interpScale = lerp(0.1, 1.0, scale);

            sampleDir.scale(interpScale);

            kernel.push(sampleDir);
        }
        return kernel;
    }
}

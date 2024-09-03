import { Vec3 } from "gl-matrix";
import { WebGLRenderTarget } from "../core/renderTarget";
import { WebGLRenderer } from "../core/renderer";
import { lerp } from "../util/math";
import { Camera, Scene } from "../core/core";
import { ShaderMaterial } from "../materials/ShaderMaterial";

export class SSAO {
    kernel: Vec3[];

    ssaoRenderTarget: WebGLRenderTarget;
    blurRenderTarget: WebGLRenderTarget;

    ssaoMaterial: ShaderMaterial;
    blurMaterial: ShaderMaterial;

    constructor(private camera: Camera, private width: number, private height: number, private kernelSize = 32) {
        this.kernel = this.generateSamplerKernel(this.kernelSize);

        this.ssaoRenderTarget = new WebGLRenderTarget(this.width, this.height);
        this.blurRenderTarget = new WebGLRenderTarget(this.width, this.height);

        this.ssaoMaterial = new ShaderMaterial({
            vertexShader: "",
            fragmentShader: "",
        });
        this.blurMaterial = new ShaderMaterial({
            vertexShader: "",
            fragmentShader: "",
        });
    }
    render(gBuffer: WebGLRenderTarget) {
        // sampler kernel
    }

    private generateSamplerKernel(kernelSize: number) {
        const kernel: Vec3[] = [];
        for (let i = 0; i < kernelSize; i++) {
            // hemisphere coords
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

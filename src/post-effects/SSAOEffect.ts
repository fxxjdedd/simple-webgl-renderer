import { Vec3 } from "gl-matrix";
import { WebGLRenderTarget } from "../core/renderTarget";
import { WebGLRenderer } from "../core/renderer";
import { lerp } from "../util/math";
import { Camera, Mesh, Scene } from "../core/core";
import { ShaderMaterial } from "../materials/ShaderMaterial";
import * as ssaoShader from "../shader/post-effects/ssao";
import { ScreenPlane } from "../geometry/ScreenPlane";
import { DataTexture } from "../textures/DataTexture";
import { FloatType, HalfFloatType, RGBAFormat, RGBFormat, UnsignedIntType } from "../constants";

export class SSAOEffect {
    kernels: Vec3[];
    noises: Float32Array;

    ssaoRenderTarget: WebGLRenderTarget;
    blurRenderTarget: WebGLRenderTarget;

    ssaoMaterial: ShaderMaterial;
    blurMaterial: ShaderMaterial;

    constructor(private camera: Camera, private width: number, private height: number, private kernelSize = 32) {
        this.kernels = this.generateSamplerKernel(this.kernelSize);
        const noiseResolution = 256;
        this.noises = this.generateSimpleNoises(noiseResolution);

        this.ssaoRenderTarget = new WebGLRenderTarget(this.width, this.height);
        this.blurRenderTarget = new WebGLRenderTarget(this.width, this.height);

        this.ssaoMaterial = new ShaderMaterial({
            vertexShader: ssaoShader.vertex,
            fragmentShader: ssaoShader.fragment,
            defines: ssaoShader.getDefines(),
            uniforms: ssaoShader.getUniforms(),
        });

        this.ssaoMaterial.uniforms["kernel"] = { value: this.kernels };
        this.ssaoMaterial.uniforms["kernelRadius"] = { value: 8 };
        this.ssaoMaterial.uniforms["minDistance"] = { value: 0.0001 };
        this.ssaoMaterial.uniforms["maxDistance"] = { value: 0.005 };
        this.ssaoMaterial.uniforms["noiseMap"] = new DataTexture(
            this.noises,
            noiseResolution,
            noiseResolution,
            RGBAFormat,
            FloatType
        );

        this.blurMaterial = new ShaderMaterial({
            vertexShader: "",
            fragmentShader: "",
        });
    }
    render(renderer: WebGLRenderer) {
        const screenPlane = new ScreenPlane();
        const ssaoMesh = new Mesh(screenPlane, this.ssaoMaterial);
        const ssaoScene = new Scene([ssaoMesh]);

        renderer.setRenderTarget(this.ssaoRenderTarget);
        renderer.render(ssaoScene, this.camera);
        renderer.setRenderTarget(null);
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

    private generateSimpleNoises(noiseResolution: number) {
        const size = noiseResolution * noiseResolution;
        const colorSize = 4;
        const noises = new Float32Array(size * colorSize);

        for (let i = 0; i < size * colorSize; i += colorSize) {
            const x1 = Math.random() * 2 - 1;
            const y1 = Math.random() * 2 - 1;

            const x2 = Math.random() * 2 - 1;
            const y2 = Math.random() * 2 - 1;

            const x3 = Math.random() * 2 - 1;
            const y3 = Math.random() * 2 - 1;

            noises[i] = Math.sqrt(x1 * x1 + y1 * y1);
            noises[i + 1] = Math.sqrt(x2 * x2 + y2 * y2);
            noises[i + 2] = Math.sqrt(x3 * x3 + y3 * y3);
            noises[i + 3] = 1.0;
        }

        return noises;
    }
}

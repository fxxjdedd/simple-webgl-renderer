import { Vec3 } from "gl-matrix";
import { WebGLRenderTarget } from "../core/renderTarget";
import { WebGLRenderer } from "../core/renderer";
import { lerp } from "../util/math";
import { Camera, Mesh, Scene } from "../core/core";
import { ShaderMaterial } from "../materials/ShaderMaterial";
import * as ssaoShader from "../shader/post-effects/ssao";
import * as copyShader from "../shader/copy";
import * as kuwaharaFilter from "../shader/filters/kuwahara";
import { ScreenPlane } from "../geometry/ScreenPlane";
import { DataTexture } from "../textures/DataTexture";
import {
    AddEquation,
    DstAlphaFactor,
    DstColorFactor,
    FloatType,
    HalfFloatType,
    RGBAFormat,
    RGBFormat,
    UnsignedIntType,
    ZeroFactor,
} from "../constants";

export class SSAOPass {
    kernels: Vec3[];
    noises: Float32Array;

    screenMesh: Mesh;
    screen: Scene;

    ssaoRenderTarget: WebGLRenderTarget;
    blurRenderTarget: WebGLRenderTarget;
    copyRenderTarget: WebGLRenderTarget; // TODO: abstract as readBuffer/writeBuffer

    ssaoMaterial: ShaderMaterial;
    blurMaterial: ShaderMaterial;
    copyMaterial: ShaderMaterial;

    constructor(private camera: Camera, private width: number, private height: number, private kernelSize = 32) {
        this.kernels = this.generateSamplerKernel(this.kernelSize);
        const noiseResolution = 256;
        this.noises = this.generateSimpleNoises(noiseResolution);

        this.screenMesh = new Mesh(new ScreenPlane(), null);
        this.screen = new Scene([this.screenMesh]); // TODO: let renderer support mesh directly

        this.ssaoRenderTarget = new WebGLRenderTarget(this.width, this.height);
        this.blurRenderTarget = new WebGLRenderTarget(this.width, this.height);
        this.copyRenderTarget = new WebGLRenderTarget(this.width, this.height);

        this.ssaoMaterial = new ShaderMaterial({
            vertexShader: ssaoShader.vertex,
            fragmentShader: ssaoShader.fragment,
            defines: ssaoShader.getDefines(),
            uniforms: ssaoShader.getUniforms(),
        });

        this.ssaoMaterial.uniforms["kernels"] = { value: this.kernels };
        this.ssaoMaterial.uniforms["kernelRadius"] = { value: 0.1 };
        this.ssaoMaterial.uniforms["minDistance"] = { value: 0.0001 };
        this.ssaoMaterial.uniforms["maxDistance"] = { value: 0.05 };
        this.ssaoMaterial.uniforms["noiseMap"] = new DataTexture(
            this.noises,
            noiseResolution,
            noiseResolution,
            RGBAFormat,
            FloatType
        );

        this.blurMaterial = new ShaderMaterial({
            vertexShader: kuwaharaFilter.vertex,
            fragmentShader: kuwaharaFilter.fragment,
        });
        this.blurMaterial.uniforms["size"] = { value: 2 };

        this.copyMaterial = new ShaderMaterial({
            vertexShader: copyShader.vertex,
            fragmentShader: copyShader.fragment,
        });
        this.copyMaterial.blending = {
            enabled: false,
            blendSrc: DstColorFactor,
            blendDst: ZeroFactor,
            blendSrcAlpha: DstAlphaFactor,
            blendDstAlpha: ZeroFactor,
            blendEquation: AddEquation,
            blendEquationAlpha: AddEquation,
        };
    }
    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget) {
        // render ssao and blur texture to ssao target
        this.screenMesh.material = this.ssaoMaterial;
        this.screenMesh.material.blending.enabled = false;
        renderer.setRenderTarget(this.ssaoRenderTarget);
        renderer.render(this.screen, this.camera);

        this.screenMesh.material = this.blurMaterial;
        this.screenMesh.material.map = this.ssaoRenderTarget.texture;
        this.screenMesh.material.blending.enabled = false;
        renderer.setRenderTarget(this.blurRenderTarget);
        renderer.render(this.screen, this.camera);

        // copy current screen pixels to final target
        this.screenMesh.material = this.copyMaterial;
        this.screenMesh.material.map = readBuffer.texture;
        this.screenMesh.material.blending.enabled = false;
        renderer.setRenderTarget(writeBuffer);
        renderer.render(this.screen, this.camera);

        // blend ssao and blur texture on final target
        this.screenMesh.material.map = this.blurRenderTarget.texture;
        this.screenMesh.material.blending.enabled = true;
        renderer.setRenderTarget(writeBuffer);
        renderer.render(this.screen, this.camera);

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

            noises[i] = Math.sqrt(x1 * x1 + y1 * y1);
            noises[i + 1] = Math.sqrt(x2 * x2 + y2 * y2);
            noises[i + 2] = 1.0;
            noises[i + 3] = 1.0;
        }

        return noises;
    }
}

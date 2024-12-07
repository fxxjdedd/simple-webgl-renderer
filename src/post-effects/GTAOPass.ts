import { Vec3 } from "gl-matrix";
import { WebGLRenderTarget } from "../core/renderTarget";
import { WebGLRenderer } from "../core/renderer";
import { lerp } from "../util/math";
import { Camera, Mesh, Scene } from "../core/core";
import { ShaderMaterial } from "../materials/ShaderMaterial";
import * as gtaoShader from "../shader/post-effects/gtao";
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

export class GTAOPass {
    kernels: Vec3[];
    noises: Float32Array;

    screenMesh: Mesh;
    screen: Scene;

    gtaoRenderTarget: WebGLRenderTarget;
    blurRenderTarget: WebGLRenderTarget;
    copyRenderTarget: WebGLRenderTarget; // TODO: abstract as readBuffer/writeBuffer

    gtaoMaterial: ShaderMaterial;
    blurMaterial: ShaderMaterial;
    copyMaterial: ShaderMaterial;

    constructor(private camera: Camera, private width: number, private height: number, private kernelSize = 32) {
        this.kernels = this.generateSamplerKernel(this.kernelSize);
        const noiseResolution = 256;
        this.noises = this.generateSimpleNoises(noiseResolution);

        this.screenMesh = new Mesh(new ScreenPlane(), null);
        this.screen = new Scene([this.screenMesh]); // TODO: let renderer support mesh directly

        this.gtaoRenderTarget = new WebGLRenderTarget(this.width, this.height);
        this.blurRenderTarget = new WebGLRenderTarget(this.width, this.height);
        this.copyRenderTarget = new WebGLRenderTarget(this.width, this.height);

        this.gtaoMaterial = new ShaderMaterial({
            vertexShader: gtaoShader.vertex,
            fragmentShader: gtaoShader.fragment,
        });
        this.gtaoMaterial.uniforms["noiseMap"] = new DataTexture(
            this.noises,
            noiseResolution,
            noiseResolution,
            RGBAFormat,
            FloatType
        );
        this.gtaoMaterial.uniforms["directionCount"] = { value: 10 };
        this.gtaoMaterial.uniforms["sampleStepCount"] = { value: 5 };

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
        this.screenMesh.material = this.gtaoMaterial;
        this.screenMesh.material.blending.enabled = false;
        renderer.setRenderTarget(this.gtaoRenderTarget);
        renderer.render(this.screen, this.camera);

        // copy current screen pixels to final target
        this.screenMesh.material = this.copyMaterial;
        this.screenMesh.material.map = readBuffer.texture;
        this.screenMesh.material.blending.enabled = false;
        renderer.setRenderTarget(writeBuffer);
        renderer.render(this.screen, this.camera);

        // blend ssao and blur texture on final target
        // this.screenMesh.material.map = this.blurRenderTarget.texture;
        this.screenMesh.material.map = this.gtaoRenderTarget.texture;
        this.screenMesh.material.blending.enabled = true;
        renderer.setRenderTarget(writeBuffer);
        renderer.render(this.screen, this.camera);

        renderer.setRenderTarget(null);
    }

    private generateSamplerKernel(kernelSize: number) {
        const kernel: Vec3[] = [];
        for (let i = 0; i < kernelSize; i++) {}
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

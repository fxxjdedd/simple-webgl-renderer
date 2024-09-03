import { Material } from "../core/core";

interface ShaderMaterialInit {
    vertexShader: string;
    fragmentShader: string;
    uniforms?: Record<string, any>;
    defines?: Record<string, any>;
}

export class ShaderMaterial extends Material {
    static Counter = 0;
    vertexShader: string;
    fragmentShader: string;
    defines: Record<string, any>;
    constructor(initOptions: ShaderMaterialInit) {
        super("ShaderMaterial" + ShaderMaterial.Counter++);
        Object.assign(this.uniforms, initOptions.uniforms);
        this.defines = initOptions.defines || {};
        this.vertexShader = initOptions.vertexShader;
        this.fragmentShader = initOptions.fragmentShader;
    }
}

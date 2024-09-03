import { Material } from "../core/core";
import { DebugMaterial, DeferredDebugMaterial, DeferredMaterial, DepthMaterial, PBRMaterial } from "../materials";
import { ShaderMaterial } from "../materials/ShaderMaterial";
import { deferredShader, pbrShader, deferredDebugShader, debugShader, depthShader } from "../shader";
import { GL_Program } from "./glProgram";
export class GL_ProgramManager {
    cache = {} as Record<string, GL_Program>;
    constructor(private gl: WebGL2RenderingContext) {}
    getProgram(material: Material, defines) {
        const name = material.name;

        const id = this.getProgramId(name, defines);
        let pragram = this.cache[id];

        if (!pragram) {
            let shader: { vertex: string; fragment: string };
            if (material instanceof ShaderMaterial) {
                Object.assign(defines, material.defines);
                shader = {
                    vertex: material.vertexShader,
                    fragment: material.fragmentShader,
                };
            } else {
                shader = this.getShader(name);
            }
            pragram = new GL_Program(this.gl, shader, defines);
            this.cache[id] = pragram;
        }

        return pragram;
    }

    private getShader(name) {
        switch (name) {
            case DebugMaterial.name:
                return debugShader;
            case DeferredDebugMaterial.name:
                return deferredDebugShader;
            case PBRMaterial.name:
                return pbrShader;
            case DeferredMaterial.name:
                return deferredShader;
            case DepthMaterial.name:
                return depthShader;
            default:
                throw new Error("No shader found for name: " + name);
        }
    }

    private getProgramId(name, defines) {
        return `${name}:${JSON.stringify(defines)}`;
    }
}

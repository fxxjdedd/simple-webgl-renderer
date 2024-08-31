import { DebugMaterial, DeferredDebugMaterial, DeferredMaterial, DepthMaterial, PBRMaterial } from "../materials";
import { deferredShader, pbrShader, deferredDebugShader, debugShader, depthShader } from "../shader";
import { GL_Program } from "./glProgram";
export class GL_ProgramManager {
    cache = {} as Record<string, GL_Program>;
    constructor(private gl: WebGL2RenderingContext) {}
    getProgram(name, defines) {
        const id = this.getProgramId(name, defines);
        let pragram = this.cache[id];
        if (!pragram) {
            pragram = new GL_Program(this.gl, this.getShader(name), defines);
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

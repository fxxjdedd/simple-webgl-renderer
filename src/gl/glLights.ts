import { Mat4, Vec2Like, Vec3, Vec3Like } from "gl-matrix";
import { DirectionalLight, Light } from "../core/light";
import { Texture } from "../core/texture";

interface DirLightUniform {
    direction: Vec3Like;
    intensity: number;
    color: Vec3Like;
}

interface LightShadowUniform {
    shadowBias: number;
    shadowNormalBias: number;
    shadowRadius: number;
    shadowMapSize: Vec2Like;
}

export class GL_Lights {
    dirLights: DirLightUniform[] = [];
    dirLightShadows: LightShadowUniform[] = [];
    dirLightShadowMaps: Texture[] = [];
    dirLightShadowMatrixs: Mat4[] = [];

    setupLights(lights: Light[]) {
        let dirLightIndex = 0;

        for (let i = 0; i < lights.length; i++) {
            const light = lights[i];
            if (light instanceof DirectionalLight) {
                const { color, intensity, target, position, shadow } = light;
                // NOTE: here is Wi
                const direction = Vec3.sub(Vec3.create(), position, target.position);
                this.dirLights[dirLightIndex] = {
                    direction,
                    intensity,
                    color,
                };

                this.dirLightShadows[dirLightIndex] = {
                    shadowBias: shadow.bias,
                    shadowNormalBias: shadow.normalBias,
                    shadowRadius: shadow.radius,
                    shadowMapSize: shadow.mapSize,
                };

                this.dirLightShadowMaps[dirLightIndex] = shadow.map.texture;

                this.dirLightShadowMatrixs[dirLightIndex] = shadow.vpMatrix;

                dirLightIndex += 1;
            }
        }
    }
}

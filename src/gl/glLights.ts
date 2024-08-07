import { Vec3 } from "gl-matrix";
import { DirectionalLight, Light } from "../core/light";

export class GL_Lights {
    dirLights = [];

    setupLights(lights: Light[]) {
        let dirLightIndex = 0;

        for (let i = 0; i < lights.length; i++) {
            const light = lights[i];
            if (light instanceof DirectionalLight) {
                const { color, intensity, target, position } = light;
                // NOTE: here is Wi
                const direction = Vec3.sub(Vec3.create(), position, target.position);
                this.dirLights[dirLightIndex] = {
                    direction,
                    intensity,
                    color,
                };
                dirLightIndex += 1;
            }
        }
    }
}

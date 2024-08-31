import { Light } from "../core/light";
import { GL_Lights } from "./glLights";

export class GL_RenderState {
    lights = new GL_Lights();

    private lightObjects: Light[] = [];

    get hasLight() {
        return this.lightObjects.length > 0;
    }

    addLight(light: Light) {
        this.lightObjects.push(light);
    }

    getLights() {
        return this.lightObjects;
    }

    setup() {
        this.lights.setupLights(this.lightObjects);
    }

    clear() {
        this.lightObjects = [];
    }
}

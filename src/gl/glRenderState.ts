import { Vec4 } from "gl-matrix";
import { Mesh } from "../core/core";
import { Light } from "../core/light";
import { WebGLRenderer } from "../core/renderer";
import { GL_Deferred } from "./glDeferred";
import { GL_Lights } from "./glLights";
import { DepthTexture } from "../textures/depthTexture";
import { WebGLRenderTarget } from "../core/renderTarget";

export class GL_RenderState {
    lights = new GL_Lights();

    deferred: GL_Deferred;

    private lightObjects: Light[] = [];
    private meshObjects: Mesh[] = [];

    constructor(private gl: WebGL2RenderingContext, private viewport: Vec4) {
        const gBufferRenderTarget = new WebGLRenderTarget(
            this.viewport.z * window.devicePixelRatio,
            this.viewport.w * window.devicePixelRatio,
            {
                enableDepthBuffer: true,
                depthTexture: new DepthTexture(gl),
                colorsCount: 3,
            }
        );
        this.deferred = new GL_Deferred(gBufferRenderTarget);
    }

    get hasLight() {
        return this.lightObjects.length > 0;
    }

    get hasDeferredMesh() {
        return this.meshObjects.length > 0;
    }

    addLight(light: Light) {
        this.lightObjects.push(light);
    }

    getLights() {
        return this.lightObjects;
    }

    addDeferredMesh(mesh: Mesh) {
        this.meshObjects.push(mesh);
    }

    getDerferredRenderTarget() {
        return this.deferred.gBufferRenderTarget;
    }

    getDeferredGBuffer() {
        return this.deferred.gBuffer;
    }

    setup() {
        this.lights.setupLights(this.lightObjects);
        this.deferred.setupMeshes(this.meshObjects);
    }

    clear() {
        this.lightObjects = [];
        this.meshObjects = [];
    }
}

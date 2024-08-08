import { OrbitControl } from "./control/OrbitControl";
import { Mesh, PerspectiveCamera, Scene } from "./core/core";
import { BoxGeometry } from "./geometry/BoxGeometry";
import { WebGLRenderer } from "./core/renderer";
import { WebGLRenderTarget } from "./core/renderTarget";
import { DepthTexture } from "./textures/depthTexture";
import { Vec3 } from "gl-matrix";
import { DirectionalLight } from "./core/light";
import { DeferredDebugMaterial, DeferredMaterial, PBRMaterial } from "./materials";
import { TextureLoader } from "./loader/TextureLoader";

const canvas = document.getElementById("webglcanvas") as HTMLCanvasElement;
const renderer = new WebGLRenderer(canvas);
const gl = renderer.gl;

/* -------------------------------------------------------------------------- */
/*                                 Geometries                                 */
/* -------------------------------------------------------------------------- */

const box = new BoxGeometry();

/* -------------------------------------------------------------------------- */
/*                                   Cameras                                  */
/* -------------------------------------------------------------------------- */

const camera = new PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 10);
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 2;
camera.lookAt(0, 0, 0);

/* -------------------------------------------------------------------------- */
/*                                  Controls                                  */
/* -------------------------------------------------------------------------- */

const orbitControl = new OrbitControl(renderer, camera);
orbitControl.setupEventListeners();

/* -------------------------------------------------------------------------- */
/*                              DeferredMaterials                             */
/* -------------------------------------------------------------------------- */

const deferredMaterial = new DeferredMaterial();
const boxMesh1 = new Mesh(box, deferredMaterial);

const depthTexture = new DepthTexture(gl);

const renderTarget = new WebGLRenderTarget(
    canvas.width * window.devicePixelRatio,
    canvas.height * window.devicePixelRatio,
    {
        enableDepthBuffer: false,
        depthTexture: depthTexture,
        colorsCount: 3,
    }
);

/* -------------------------------------------------------------------------- */
/*                                PBRMaterials                                */
/* -------------------------------------------------------------------------- */

const normalMap = new TextureLoader().load("/textures/medieval_red_brick_1k/medieval_red_brick_nor_gl_1k.png");

const pbrMaterial = new PBRMaterial();
const boxMesh2 = new Mesh(box, pbrMaterial);
pbrMaterial.uniforms = {
    g_diffuse: renderTarget.textures[0],
    g_normal: renderTarget.textures[1],
    g_pos: renderTarget.textures[2],
    g_depth: depthTexture,
};
pbrMaterial.normalMap = normalMap;

const dirLight = new DirectionalLight();
dirLight.position = new Vec3(5, 5, 5);
dirLight.target = boxMesh2;
dirLight.color = new Vec3(1, 0, 0);

/* -------------------------------------------------------------------------- */
/*                           DeferredDebugMaterials                           */
/* -------------------------------------------------------------------------- */

const deferredDebugMaterial1 = new DeferredDebugMaterial();
const boxMesh4depthviewer1 = new Mesh(box, deferredDebugMaterial1);
boxMesh4depthviewer1.position = new Vec3(0, 0, 0);
deferredDebugMaterial1.map = renderTarget.textures[0];

const deferredDebugMaterial2 = new DeferredDebugMaterial();
const boxMesh4depthviewer2 = new Mesh(box, deferredDebugMaterial2);
boxMesh4depthviewer2.position = new Vec3(-2, 0, 0);
deferredDebugMaterial2.map = renderTarget.textures[1];

const deferredDebugMaterial3 = new DeferredDebugMaterial();
const boxMesh4depthviewer3 = new Mesh(box, deferredDebugMaterial3);
boxMesh4depthviewer3.position = new Vec3(2, 0, 0);
deferredDebugMaterial3.map = depthTexture;

/* -------------------------------------------------------------------------- */
/*                                   Scenes                                   */
/* -------------------------------------------------------------------------- */

const deferredScene = new Scene();
deferredScene.objects = [boxMesh1];
const viewportScene = new Scene();
viewportScene.objects = [boxMesh4depthviewer1, boxMesh4depthviewer2, boxMesh4depthviewer3];
const renderScene = new Scene();
renderScene.objects = [boxMesh2, dirLight];

/* -------------------------------------------------------------------------- */
/*                                  run loop                                  */
/* -------------------------------------------------------------------------- */
function animate() {
    renderer.setRenderTarget(renderTarget);
    renderer.render(deferredScene, camera);

    renderer.setRenderTarget(null);

    renderer.render(renderScene, camera);

    renderer.setViewport(0, 0, canvas.width / 3, canvas.height / 3);
    renderer.setClearbits(0);
    renderer.render(viewportScene, camera);

    requestAnimationFrame(() => {
        animate();
    });
}
animate();

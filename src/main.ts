import { OrbitControl } from "./control/OrbitControl";
import { Geometry, Mesh, PerspectiveCamera, Scene } from "./core/core";
import { BoxGeometry } from "./geometry/BoxGeometry";
import { WebGLRenderer } from "./core/renderer";
import { WebGLRenderTarget } from "./core/renderTarget";
import { DepthTexture } from "./textures/depthTexture";
import { Vec3, Vec4 } from "gl-matrix";
import { DirectionalLight } from "./core/light";
import { DebugMaterial, DeferredDebugMaterial, DeferredMaterial, PBRMaterial } from "./materials";
import { TextureLoader } from "./loader/TextureLoader";
import { OBJLoader } from "./loader/OBJLoader";
import { ScreenPlane } from "./geometry/ScreenPlane";
import { getAdaptiveAspectRatio } from "./util/texture";
const canvas = document.getElementById("webglcanvas") as HTMLCanvasElement;
const renderer = new WebGLRenderer(canvas);
const gl = renderer.gl;

/* -------------------------------------------------------------------------- */
/*                                 Geometries                                 */
/* -------------------------------------------------------------------------- */

// const objLoader1 = new OBJLoader();
const objLoader2 = new OBJLoader();
// const cube = objLoader1.load("/3d-models/cube.obj");
const bunny = objLoader2.load("/3d-models/stanford-bunny.obj");

const geometryPassGeometry = bunny;
const screenPlane = new ScreenPlane();

// let box = new BoxGeometry(2, 2, 2);
// box = bunny;
// console.log(box);

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

const diffuseMap = new TextureLoader().load("/textures/medieval_red_brick_1k/medieval_red_brick_diff_1k.jpg");
const normalMap = new TextureLoader().load("/textures/medieval_red_brick_1k/medieval_red_brick_nor_gl_1k.png");
const deferredMaterial = new DeferredMaterial();
deferredMaterial.map = diffuseMap;
// deferredMaterial.normalMap = normalMap;
deferredMaterial.uniforms.diffuse = new Vec4(1, 1, 1, 1.0);

const geometryPassMesh = new Mesh(geometryPassGeometry, deferredMaterial);

const depthTexture = new DepthTexture(gl);

const renderTarget = new WebGLRenderTarget(
    canvas.width * window.devicePixelRatio,
    canvas.height * window.devicePixelRatio,
    {
        enableDepthBuffer: true,
        depthTexture: depthTexture,
        colorsCount: 3,
    }
);

/* -------------------------------------------------------------------------- */
/*                                PBRMaterials                                */
/* -------------------------------------------------------------------------- */
const pbrMaterial = new PBRMaterial();
const lightingPassMesh = new Mesh(screenPlane, pbrMaterial);
pbrMaterial.uniforms = {
    g_diffuse: renderTarget.textures[0],
    g_normal: renderTarget.textures[1],
    g_pos: renderTarget.textures[2],
    g_depth: depthTexture,
    metalness: 0.0,
    roughness: 1.0,
};

const dirLight = new DirectionalLight();
dirLight.position = new Vec3(5, 5, 5);
dirLight.target = geometryPassMesh;
dirLight.color = new Vec3(1, 1, 1);

/* -------------------------------------------------------------------------- */
/*                           DeferredDebugMaterials                           */
/* -------------------------------------------------------------------------- */

const debugMaterial1 = new DebugMaterial();
const debugMaterial2 = new DebugMaterial();
const debugMaterial3 = new DebugMaterial();
const debugMaterial4 = new DebugMaterial();
const debug1 = new Mesh(screenPlane, debugMaterial1);
const debug2 = new Mesh(screenPlane, debugMaterial2);
const debug3 = new Mesh(screenPlane, debugMaterial3);
const debug4 = new Mesh(screenPlane, debugMaterial4);

const adaptiveAspectRatio = getAdaptiveAspectRatio(renderTarget.width, renderTarget.height);

debugMaterial1.map = renderTarget.textures[0];

debugMaterial1.uniforms.adaptiveAspectRatio = adaptiveAspectRatio;
debugMaterial2.map = renderTarget.textures[1];
debugMaterial2.uniforms.adaptiveAspectRatio = adaptiveAspectRatio;
debugMaterial3.map = renderTarget.textures[2];
debugMaterial3.uniforms.adaptiveAspectRatio = adaptiveAspectRatio;
debugMaterial4.map = depthTexture;
debugMaterial4.uniforms.adaptiveAspectRatio = adaptiveAspectRatio;

/* -------------------------------------------------------------------------- */
/*                                   Scenes                                   */
/* -------------------------------------------------------------------------- */

const deferredScene = new Scene([geometryPassMesh]);

const viewportScene1 = new Scene([debug1]);
const viewportScene2 = new Scene([debug2]);
const viewportScene3 = new Scene([debug3]);
const viewportScene4 = new Scene([debug4]);

const renderScene = new Scene([lightingPassMesh, dirLight]);

/* -------------------------------------------------------------------------- */
/*                               event handlers                               */
/* -------------------------------------------------------------------------- */
objLoader2.onLoad((obj) => {
    geometryPassMesh.scale.set([10, 10, 10]);
    geometryPassMesh.alignToBBoxCenter(obj.bbox);
});

/* -------------------------------------------------------------------------- */
/*                                  run loop                                  */
/* -------------------------------------------------------------------------- */
function animate() {
    renderer.setRenderTarget(renderTarget);
    renderer.render(deferredScene, camera);

    renderer.setRenderTarget(null);

    renderer.render(renderScene, camera);

    const blockSize = canvas.height / 5;
    renderer.setViewport(0, 0, blockSize, blockSize);
    renderer.setClearbits(0);
    renderer.render(viewportScene1, camera);

    renderer.setViewport(blockSize, 0, blockSize, blockSize);
    renderer.setClearbits(0);
    renderer.render(viewportScene2, camera);

    renderer.setViewport(blockSize, blockSize, blockSize, blockSize);
    renderer.setClearbits(0);
    renderer.render(viewportScene3, camera);

    renderer.setViewport(0, blockSize, blockSize, blockSize);
    renderer.setClearbits(0);
    renderer.render(viewportScene4, camera);

    requestAnimationFrame(() => {
        animate();
    });
}
animate();

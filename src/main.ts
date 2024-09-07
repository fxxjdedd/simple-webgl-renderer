import { OrbitControl } from "./control/OrbitControl";
import { Geometry, Mesh, OrthoCamera, PerspectiveCamera, Scene } from "./core/core";
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
import { Plane } from "./geometry/Plane";
import { SSAOEffect } from "./post-effects/SSAOEffect";
const canvas = document.getElementById("webglcanvas") as HTMLCanvasElement;
const renderer = new WebGLRenderer(canvas);
const gl = renderer.gl;

/* -------------------------------------------------------------------------- */
/*                                 Geometries                                 */
/* -------------------------------------------------------------------------- */

const objLoader = new OBJLoader();
// const cube = objLoader.load("/3d-models/cube.obj");
// const bunny = objLoader.load("/3d-models/stanford-bunny.obj");
const rockerArm = objLoader.load("/3d-models/rocker-arm.obj");

const geometryPassGeometry = rockerArm;
const screenPlane = new ScreenPlane();
const groundPlane = new Plane();

// let box = new BoxGeometry(2, 2, 2);
// box = bunny;
// console.log(box);

/* -------------------------------------------------------------------------- */
/*                                   Cameras                                  */
/* -------------------------------------------------------------------------- */

const camera = new PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 10);
// const camera = new OrthoCamera(-5, 5, 5, -5, 0.05, 500);
camera.position.x = 1;
camera.position.y = 0.5;
camera.position.z = 1;
camera.lookAt(0, 0, 0);

/* -------------------------------------------------------------------------- */
/*                                  Controls                                  */
/* -------------------------------------------------------------------------- */

const orbitControl = new OrbitControl(renderer, camera);
orbitControl.setupEventListeners();

/* -------------------------------------------------------------------------- */
/*                                PBRMaterials                                */
/* -------------------------------------------------------------------------- */

const diffuseMap = new TextureLoader().load("/textures/ganges_river_pebbles_1k/ganges_river_pebbles_diff_1k.jpg");
const normalMap = new TextureLoader().load("/textures/ganges_river_pebbles_1k/ganges_river_pebbles_nor_gl_1k.png");

// plane
const pbrMaterial4Plane = new PBRMaterial();
pbrMaterial4Plane.map = diffuseMap;
pbrMaterial4Plane.normalMap = normalMap;
const groundPlaneMesh = new Mesh(groundPlane, pbrMaterial4Plane);
groundPlaneMesh.receiveShadow = true;
const scale = 2;
groundPlaneMesh.scale.set(Array(3).fill(scale));

// model
const pbrMaterial4Model = new PBRMaterial();
const modelMesh = new Mesh(geometryPassGeometry, pbrMaterial4Model);
modelMesh.receiveShadow = true;
pbrMaterial4Model.uniforms.metalness = 0.0;
pbrMaterial4Model.uniforms.roughness = 1.0;

const dirLight = new DirectionalLight();
dirLight.castShadow = true;
dirLight.position = new Vec3(5, 5, 5);
dirLight.target = groundPlaneMesh;
dirLight.color = new Vec3(1, 1, 1);
dirLight.intensity = 1.0;
// dirLight.shadow.bias = -0.00005;

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

const gBufferRenderTarget = renderer.renderState.getDerferredRenderTarget();
const adaptiveAspectRatio = getAdaptiveAspectRatio(gBufferRenderTarget.width, gBufferRenderTarget.height);

debugMaterial1.map = gBufferRenderTarget.textures[0];
debugMaterial1.uniforms.adaptiveAspectRatio = adaptiveAspectRatio;
debugMaterial2.map = gBufferRenderTarget.textures[1];
debugMaterial2.uniforms.adaptiveAspectRatio = adaptiveAspectRatio;
// debugMaterial3.map = dirLight.shadow.map.texture;
debugMaterial3.uniforms.adaptiveAspectRatio = adaptiveAspectRatio;
debugMaterial4.map = gBufferRenderTarget.textures[2];
debugMaterial4.uniforms.adaptiveAspectRatio = adaptiveAspectRatio;

/* -------------------------------------------------------------------------- */
/*                                   Scenes                                   */
/* -------------------------------------------------------------------------- */

const renderScene = new Scene([groundPlaneMesh, modelMesh, dirLight]);

const viewportScene1 = new Scene([debug1]);
const viewportScene2 = new Scene([debug2]);
const viewportScene3 = new Scene([debug3]);
const viewportScene4 = new Scene([debug4]);

/* -------------------------------------------------------------------------- */
/*                               event handlers                               */
/* -------------------------------------------------------------------------- */
objLoader.onLoad((obj) => {
    // const scale = 5;
    // geometryPassMesh.scale.set([scale, scale, scale]);
    modelMesh.alignToBBox(obj.bbox, "bottom");
});

/* -------------------------------------------------------------------------- */
/*                                post-effects                                */
/* -------------------------------------------------------------------------- */

// const ssaoEffect = new SSAOEffect(camera, gBufferRenderTarget, renderer.viewport.z, renderer.viewport.w, 32);

/* -------------------------------------------------------------------------- */
/*                                  run loop                                  */
/* -------------------------------------------------------------------------- */
function animate() {
    renderer.enableShadowPass = true;
    renderer.render(renderScene, camera);
    debugMaterial3.map = dirLight.shadow.map.texture;
    renderer.enableShadowPass = false;

    /* ------------------------- post-effects starts ------------------------- */
    // ssaoEffect.render(renderer);

    /* -------------------------- post-effects ends -------------------------- */

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

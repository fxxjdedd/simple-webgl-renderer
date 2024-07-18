import { OrbitControl } from "./control/OrbitControl";
import { Mesh, DeferredMaterial, PBRMaterial, PerspectiveCamera, UnlitMaterial } from "./core/core";
import { BoxGeometry } from "./geometry/BoxGeometry";
import { WebGLRenderer } from "./core/renderer";
import { WebGLRenderTarget } from "./core/renderTarget";
import { DepthTexture } from "./textures/depthTexture";
import { GL_Texture } from "./gl/glTexture";

const canvas = document.getElementById("webglcanvas") as HTMLCanvasElement;
const renderer = new WebGLRenderer(canvas);
const gl = renderer.gl;

const deferredMaterial = new DeferredMaterial();

const box = new BoxGeometry();
const boxMesh1 = new Mesh(box, deferredMaterial);

const camera = new PerspectiveCamera(60, canvas.width / canvas.height);
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 2;
camera.lookAt(0, 0, 0);

const orbitControl = new OrbitControl(renderer, camera);
orbitControl.setupEventListeners();

const depthTexture = new DepthTexture(gl);

const renderTarget = new WebGLRenderTarget(2048, 1024, {
    wrapS: gl.REPEAT,
    wrapT: gl.REPEAT,
    magFilter: gl.LINEAR,
    minFilter: gl.LINEAR,
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE,
    enableDepthBuffer: true,
    depthTexture: depthTexture,
    colorsCount: 2,
});

renderer.setRenderTarget(renderTarget);

// const pbrMaterial = new PBRMaterial();
// const boxMesh2 = new Mesh(box, pbrMaterial);
// pbrMaterial.uniforms = {
//     g_diffuse: renderTarget.textures[0],
//     g_normal: renderTarget.textures[1],
// };

const unlitMaterial = new UnlitMaterial();
const boxMesh4depthviewer = new Mesh(box, unlitMaterial);

// unlitMaterial.map = renderTarget.depthTexture;
unlitMaterial.map = renderTarget.textures[0];
unlitMaterial.map = renderTarget.textures[1];
console.log(renderTarget.textures);
function animate() {
    renderer.setRenderTarget(renderTarget);
    renderer.render(boxMesh1, camera);

    // // renderer.setRenderTarget(null);
    // // renderer.render(boxMesh2, camera);

    renderer.setRenderTarget(null);
    renderer.render(boxMesh4depthviewer, camera);

    requestAnimationFrame(() => {
        animate();
    });
}
animate();

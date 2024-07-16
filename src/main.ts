import { OrbitControl } from "./control/OrbitControl";
import { Mesh, DeferredMaterial, PBRMaterial, PerspectiveCamera, UnlitMaterial } from "./core/core";
import { BoxGeometry } from "./geometry/BoxGeometry";
import { WebGLRenderer } from "./core/renderer";
import { WebGLRenderTarget } from "./core/renderTarget";
import { DepthTexture } from "./textures/depthTexture";

const canvas = document.getElementById("webglcanvas") as HTMLCanvasElement;
const depthTextureViewer = document.getElementById("depthtexture") as HTMLCanvasElement;
const renderer = new WebGLRenderer(canvas);
const renderer4TextureViewer = new WebGLRenderer(depthTextureViewer);
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

const renderTarget = new WebGLRenderTarget(
    canvas.width * window.devicePixelRatio,
    canvas.height * window.devicePixelRatio,
    {
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        magFilter: gl.LINEAR,
        minFilter: gl.LINEAR,
        format: gl.RGBA,
        type: gl.UNSIGNED_SHORT,
        enableDepthBuffer: true,
        depthTexture: depthTexture,
        colorsCount: 2,
    }
);

const pbrMaterial = new PBRMaterial();
const boxMesh2 = new Mesh(box, pbrMaterial);
pbrMaterial.uniforms = {
    t_diffuse: renderTarget.framebuffer.colorTextures[0],
    t_normal: renderTarget.framebuffer.colorTextures[1],
};

const unlitMaterial = new UnlitMaterial();
const boxMesh4depthviewer = new Mesh(box, unlitMaterial);
unlitMaterial.map = renderTarget.framebuffer.depthTexture;

function animate() {
    renderer.setRenderTarget(renderTarget);
    renderer.render(boxMesh1, camera);

    renderer.setRenderTarget(null);
    renderer.render(boxMesh2, camera);

    renderer4TextureViewer.render(boxMesh4depthviewer, camera);

    requestAnimationFrame(() => {
        animate();
    });
}
animate();

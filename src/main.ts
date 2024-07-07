import { OrbitControl } from "./control/OrbitControl";
import { Mesh, PathTracerMaterial, PerspectiveCamera } from "./core";
import { BoxGeometry } from "./geometry/BoxGeometry";
import { WebGLRenderer } from "./renderer";

const canvas = document.getElementById("webglcanvas") as HTMLCanvasElement;
const renderer = new WebGLRenderer(canvas);

const pathtracerMat = new PathTracerMaterial();
const box = new BoxGeometry();
const boxMesh = new Mesh(box, pathtracerMat);

const camera = new PerspectiveCamera(60, canvas.width / canvas.height);
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 2;
camera.lookAt(0, 0, 0);

const orbitControl = new OrbitControl(renderer, camera);
orbitControl.setupEventListeners();

function animate() {
    renderer.render(boxMesh, camera);
    requestAnimationFrame(() => {
        animate();
    });
}
animate();

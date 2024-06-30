import { Mesh, PathTracerMaterial, PerspectiveCamera } from "./core";
import { BoxGeometry } from "./geometry/BoxGeometry";
import { WebGLRenderer } from "./renderer";

const canvas = document.getElementById("webglcanvas") as HTMLCanvasElement;
const renderer = new WebGLRenderer(canvas);

const pathtracerMat = new PathTracerMaterial();
const box = new BoxGeometry();
const boxMesh = new Mesh(box, pathtracerMat);

const camera = new PerspectiveCamera(60, canvas.width / canvas.height);
camera.position[0] = 1;
camera.position[1] = 1;
camera.position[2] = 2;
camera.lookAt(0, 0, 0);

function animate() {
    renderer.render(boxMesh, camera);
    requestAnimationFrame(() => {
        animate();
    });
}
animate();

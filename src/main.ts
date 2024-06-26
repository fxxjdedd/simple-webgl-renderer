import { Mesh, PathTracerMaterial, PerspectiveCamera } from "./core";
import { BoxGeometry } from "./geometry/BoxGeometry";
import { WebGLRenderer } from "./renderer";

const renderer = new WebGLRenderer(document.getElementById("webglcanvas") as HTMLCanvasElement);

const pathtracerMat = new PathTracerMaterial();
const box = new BoxGeometry();
const boxMesh = new Mesh(box, pathtracerMat);
const camera = new PerspectiveCamera();

function animate() {
    renderer.render(boxMesh, camera);
    requestAnimationFrame(() => {
        animate();
    });
}
animate();

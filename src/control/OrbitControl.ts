import { Camera } from "../core";
import { WebGLRenderer } from "../renderer";
import { Vec3, Vec2, Quat, Vec3Like } from "gl-matrix";

enum ControlState {
    none,
    rotate,
    pan,
    zoom,
}

export class OrbitControl {
    target: Vec3;
    state: ControlState = ControlState.none;
    sphericalCoords = new SphericalCoords();

    rotateState = new SphericalCoords();
    panState = {
        x: 0,
        y: 0,
    };

    rotateStart: Vec2;
    rotateEnd: Vec2;

    panStart: Vec2;
    panEnd: Vec2;

    constructor(private renderer: WebGLRenderer, private camera: Camera) {
        this.target = camera.target;
    }

    setupEventListeners() {
        const dom = this.renderer.canvas;

        dom.addEventListener("pointerdown", this.handlePointerDown);
        dom.addEventListener("pointercancel", this.handlePointerUp);
        dom.addEventListener("contextmenu", this.handleContextMenu);
        dom.addEventListener("wheel", this.handleWheel);
    }

    clearEventListeners() {
        const dom = this.renderer.canvas;

        dom.removeEventListener("pointerdown", this.handlePointerDown);
        dom.removeEventListener("pointercancel", this.handlePointerUp);
        dom.removeEventListener("contextmenu", this.handleContextMenu);
        dom.removeEventListener("wheel", this.handleWheel);
    }

    handlePointerDown = (e: PointerEvent) => {
        const dom = this.renderer.canvas;

        this.rotateStart = Vec2.fromValues(e.clientX, e.clientY);

        dom.addEventListener("pointermove", this.handlePointerMove);
        dom.addEventListener("pointerup", this.handlePointerUp);
    };

    handlePointerUp = () => {
        const dom = this.renderer.canvas;
        dom.removeEventListener("pointermove", this.handlePointerMove);
        dom.removeEventListener("pointerup", this.handlePointerUp);
    };

    handleContextMenu = (e: Event) => {
        e.preventDefault();
    };

    handleWheel = () => {};

    handlePointerMove = (e: PointerEvent) => {
        const dom = this.renderer.canvas;
        this.rotateEnd = Vec2.fromValues(e.clientX, e.clientY);

        const deltaX = this.rotateEnd[0] - this.rotateStart[0];
        const deltaY = this.rotateEnd[1] - this.rotateStart[1];

        const deltaTheta = 2 * Math.PI * (deltaX / dom.clientHeight);
        const deltaPhi = 2 * Math.PI * (deltaY / dom.clientHeight);

        const speed = 1;
        this.rotateState.theta -= deltaTheta * speed;
        this.rotateState.phi -= deltaPhi * speed;

        Vec2.copy(this.rotateStart, this.rotateEnd);

        this.updateCamera();
    };

    updateCamera() {
        // this.camera.lookAt(this.panState.x, 0, this.panState.y);
        // move camera from world-space to spherical-space
        const quat = Quat.rotationTo(new Quat(), this.camera.up, [0, 1, 0]);
        const quatInv = Quat.invert(new Quat(), quat);

        let ssPosition = new Vec3();
        Vec3.transformQuat(ssPosition, this.camera.position, quat);
        this.sphericalCoords.setFromCoord(ssPosition);
        this.sphericalCoords.phi += this.rotateState.phi;
        this.sphericalCoords.theta += this.rotateState.theta;
        ssPosition = this.sphericalCoords.getCoords();
        this.rotateState.set(0, 0, 0);

        // recover camera from spherical-space to world-space
        const wsPosition = new Vec3();
        Vec3.transformQuat(wsPosition, ssPosition, quatInv);
        this.camera.position = wsPosition;
        this.camera.lookAt(0, 0, 0);
    }
}

class SphericalCoords {
    theta = 0;
    phi = 0;
    radius = 1;

    set(x, y, z) {
        this.theta = x;
        this.phi = y;
        this.radius = z;
    }

    setFromCoord(coord: Vec3) {
        const mag = Vec3.mag(coord);
        const theta = Math.atan(coord.x / coord.z);
        const phi = Math.acos(coord.y / mag);

        this.radius = mag;
        this.phi = phi;
        this.theta = theta;
    }

    getCoords() {
        const projLength = this.radius * Math.sin(this.phi);
        const x = projLength * Math.sin(this.theta);
        const z = projLength * Math.cos(this.theta);
        const y = this.radius * Math.cos(this.phi);
        return new Vec3(x, y, z);
    }
}

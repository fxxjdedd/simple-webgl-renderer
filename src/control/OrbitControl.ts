import { Camera } from "../core/core";
import { WebGLRenderer } from "../core/renderer";
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
    panState = new Vec2();

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

        const button = e.button;

        switch (button) {
            case 0:
                this.state = ControlState.rotate;
                break;
            case 1:
                this.state = ControlState.zoom;
                break;
            case 2:
                this.state = ControlState.pan;
                break;
            default:
                this.state = ControlState.none;
        }

        switch (this.state) {
            case ControlState.rotate:
                this.rotateStart = Vec2.fromValues(e.clientX, e.clientY);
                break;
            case ControlState.zoom:
            case ControlState.pan:
                this.panStart = Vec2.fromValues(e.clientX, e.clientY);
                break;
        }

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

        switch (this.state) {
            case ControlState.rotate: {
                // left
                this.rotateEnd = Vec2.fromValues(e.clientX, e.clientY);

                const deltaX = this.rotateEnd[0] - this.rotateStart[0];
                const deltaY = this.rotateEnd[1] - this.rotateStart[1];

                const deltaTheta = 2 * Math.PI * (deltaX / dom.clientHeight);
                const deltaPhi = 2 * Math.PI * (deltaY / dom.clientHeight);

                const speed = 1;
                this.rotateState.theta -= deltaTheta * speed;
                this.rotateState.phi -= deltaPhi * speed;

                this.rotateStart.copy(this.rotateEnd);
                break;
            }
            case ControlState.zoom:
            case ControlState.pan: {
                this.panEnd = Vec2.fromValues(e.clientX, e.clientY);

                const deltaX = this.panEnd[0] - this.panStart[0];
                const deltaY = this.panEnd[1] - this.panStart[1];
                const deltaXMove = deltaX / dom.clientHeight;
                const deltaYMove = deltaY / dom.clientHeight;

                this.panState.x -= deltaXMove;
                this.panState.y -= deltaYMove;

                this.panStart.copy(this.panEnd);

                break;
            }
        }

        this.updateCamera();
    };

    updateCamera() {
        // move camera from world-space to spherical-space
        const quat = Quat.rotationTo(new Quat(), this.camera.up, [0, 1, 0]);
        const quatInv = Quat.invert(new Quat(), quat);

        let ssPosition = new Vec3();
        Vec3.transformQuat(ssPosition, this.camera.position, quat);
        this.sphericalCoords.setFromCoord(ssPosition);
        this.sphericalCoords.phi += this.rotateState.phi;
        this.sphericalCoords.theta += this.rotateState.theta;
        ssPosition = this.sphericalCoords.getCoords();
        this.rotateState.set([0, 0, 0]);

        // recover camera from spherical-space to world-space
        const wsPosition = new Vec3();
        Vec3.transformQuat(wsPosition, ssPosition, quatInv);
        this.camera.position = wsPosition;

        const panVecBasisX = new Vec3(this.camera.matrix.slice(0, 4 - 1)).normalize();
        // make panVecBasisY equals (camera.right x camera.up) so that camera moves parallel to the y panel
        const panVecBasisY = Vec3.cross(new Vec3(), panVecBasisX, this.camera.up) as Vec3;

        panVecBasisX.scale(this.panState.x);
        panVecBasisY.scale(this.panState.y);
        const panVec = panVecBasisX.add(panVecBasisY);

        this.camera.position.add(panVec);
        const target = this.camera.target.add(panVec);

        this.camera.lookAt(target.x, target.y, target.z);

        this.panState.set([0, 0]);
    }
}

class SphericalCoords {
    theta = 0;
    phi = 0;
    radius = 1;

    set(v: Vec3Like) {
        this.theta = v[0];
        this.phi = v[1];
        this.radius = v[2];
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

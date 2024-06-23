import { Geometry } from "../core";
import { GL_Program } from "./glProgram";
import { GL_VertexAttributeBuffer } from "./glVertexAttributeBuffer";

export class GL_BindingStates {
    bindingStates = new WeakMap<Geometry, GL_BindingState>();

    constructor(public gl: WebGL2RenderingContext) {}

    getBindingState(program: GL_Program, geometry: Geometry) {
        return this.bindingStates.get(geometry);
    }

    setBindingState(program: GL_Program, geometry: Geometry) {
        const bindingState = new GL_BindingState(this.gl, program, geometry);
        this.bindingStates.set(geometry, bindingState);
    }
}

export class GL_BindingState {
    vertexAttributeBuffer: GL_VertexAttributeBuffer;
    constructor(gl: WebGL2RenderingContext, program: GL_Program, geometry: Geometry) {
        this.vertexAttributeBuffer = new GL_VertexAttributeBuffer(gl, geometry.structuredData);
        this.vertexAttributeBuffer.setupVAO(program);
    }

    bind() {
        this.vertexAttributeBuffer.bindVAO();
    }
}

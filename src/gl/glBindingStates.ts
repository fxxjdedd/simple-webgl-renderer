import { Geometry } from "../core/core";
import { GL_IndexBuffer } from "./glIndexBuffer";
import { GL_Program } from "./glProgram";
import { GL_VertexAttributeBuffer } from "./glVertexAttributeBuffer";

export class GL_BindingStates {
    bindingStates = new WeakMap<Geometry, GL_BindingState>();

    constructor(private gl: WebGL2RenderingContext) {}

    getBindingState(program: GL_Program, geometry: Geometry) {
        return this.bindingStates.get(geometry);
    }

    setBindingState(program: GL_Program, geometry: Geometry) {
        const bindingState = new GL_BindingState(this.gl, program, geometry);
        this.bindingStates.set(geometry, bindingState);
        return bindingState;
    }
}

export class GL_BindingState {
    vertexAttributeBuffer: GL_VertexAttributeBuffer;
    indexBuffer: GL_IndexBuffer | null;
    constructor(private gl: WebGL2RenderingContext, private program: GL_Program, private geometry: Geometry) {
        this.geometry = geometry;
        this.vertexAttributeBuffer = new GL_VertexAttributeBuffer(gl, geometry.layout);
        this.vertexAttributeBuffer.setupVAO(this.program);
    }

    bind() {
        if (this.geometry.isDirty) {
            this.vertexAttributeBuffer.updateBufferData(this.geometry.attributes);

            if (this.geometry.index != null) {
                if (!this.indexBuffer) {
                    this.indexBuffer = new GL_IndexBuffer(this.gl);
                }
                this.indexBuffer.updateBufferData(this.geometry.index);
            } else {
                this.indexBuffer = null;
            }

            this.geometry.isDirty = false;
        }
        this.vertexAttributeBuffer.bindVAO();
        if (this.indexBuffer) {
            this.indexBuffer.bindBuffer();
        }
    }
}

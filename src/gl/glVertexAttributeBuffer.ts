import { BufferLayout, StructuredData, getArrayCtorOfCode } from "../util";
import { GL_Program } from "./glProgram";

export function getGLType(gl: WebGL2RenderingContext, typeCode: number) {
    switch (getArrayCtorOfCode(typeCode)) {
        case Uint8Array:
            return gl.UNSIGNED_BYTE;
        case Int8Array:
            return gl.BYTE;
        case Uint16Array:
            return gl.UNSIGNED_SHORT;
        case Int16Array:
            return gl.SHORT;
        case Uint32Array:
            return gl.UNSIGNED_INT;
        case Int32Array:
            return gl.INT;
        case Float32Array:
            return gl.FLOAT;
        case Float64Array:
            throw new Error("Double float precision not supported yet.");
        default:
            throw new Error(`Invalid type code: ${typeCode.toString(2)}`);
    }
}

export class GL_VertexAttributeBuffer {
    glBuffer: WebGLBuffer;
    glVAO: WebGLVertexArrayObject;
    structuredData: StructuredData<BufferLayout>;
    constructor(public gl: WebGL2RenderingContext, public layout: BufferLayout) {
        this.structuredData = new StructuredData(layout);
        this.glBuffer = gl.createBuffer();
        this.glVAO = gl.createVertexArray();
    }

    updateBufferData(attributes: Record<string, number[]>) {
        const gl = this.gl;
        this.structuredData.merge(attributes);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.structuredData.buffer, gl.STATIC_DRAW);
    }

    bindBuffer() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
    }

    setupVAO(program: GL_Program) {
        this.bindBuffer();
        this.bindVAO();
        for (const attrName in this.structuredData.accessors) {
            const { type, components, offset, stride } = this.structuredData.accessors[attrName];
            const attribLocation = program.attributes[attrName].location;
            this.gl.enableVertexAttribArray(attribLocation);
            this.gl.vertexAttribPointer(attribLocation, components, getGLType(this.gl, type), false, stride, offset);
        }
    }

    bindVAO() {
        this.gl.bindVertexArray(this.glVAO);
    }
}

import { BufferLayout, StructuredData } from "../util";
import { GL_Program } from "./glProgram";

export class GL_VertexArrayObjectBinding {
    glBuffer: WebGLBuffer;
    constructor(
        public gl: WebGLRenderingContext,
        public structuredData: StructuredData<BufferLayout>
    ) {
        this.glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, structuredData.buffer, gl.STATIC_DRAW);
    }

    bind() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
    }

    enable() {}

    setup(program: GL_Program) {
        for (const attrName in this.structuredData.accessors) {
            const { type, components, offset, stride } = this.structuredData.accessors[attrName];
        }
    }
}

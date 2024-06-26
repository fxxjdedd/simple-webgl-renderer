import { BufferLayout, IndexStructuredData, StructuredData } from "../util";

export class GL_IndexBuffer {
    glBuffer: WebGLBuffer;
    structuredData: IndexStructuredData;
    constructor(public gl: WebGL2RenderingContext, indexData: number[]) {
        this.glBuffer = gl.createBuffer();
        this.structuredData = new IndexStructuredData();
        this.structuredData.merge({
            index: indexData,
        });
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.structuredData.buffer, gl.STATIC_DRAW);
    }

    bindBuffer() {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.glBuffer);
    }
}

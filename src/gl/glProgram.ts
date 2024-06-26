export interface Shader {
    vertex: string;
    fragment: string;
    uniforms: string[];
    attributes: string[];
}

export class GL_Program {
    program: globalThis.WebGLProgram;
    attribLocations: Record<string, number>;
    uniformLocations: Record<string, WebGLUniformLocation>;

    constructor(private gl: WebGL2RenderingContext, shader: Shader) {
        const program = gl.createProgram();

        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, shader.vertex);
        gl.compileShader(vs);

        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(vs));
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, shader.fragment);
        gl.compileShader(fs);

        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(fs));
        }

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }

        for (const attrName of shader.attributes) {
            this.attribLocations[attrName] = gl.getAttribLocation(program, attrName);
        }

        for (const uniformName of shader.uniforms) {
            this.uniformLocations[uniformName] = gl.getUniformLocation(program, uniformName);
        }

        this.program = program;
    }

    setUniformWithSetter(name, value, setter) {
        const addr = this.gl.getUniformLocation(this.program, name);
        setter(addr, value);
    }

    draw(start, count) {
        const gl = this.gl;
        gl.drawElements(
            gl.TRIANGLES,
            count,
            gl.UNSIGNED_SHORT,
            start * Uint16Array.BYTES_PER_ELEMENT
        );
    }
}

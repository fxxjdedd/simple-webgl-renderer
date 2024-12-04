import { GL_IndexBuffer } from "./glIndexBuffer";
import { GL_State } from "./glState";
import { GL_Textures } from "./glTextures";
import { GL_Uniforms } from "./glUniforms";

export interface Shader {
    vertex: string;
    fragment: string;
}

export class GL_Program {
    program: globalThis.WebGLProgram;
    attributes: Record<string, { type: number; location: number; locationSize: number }>;
    uniforms: GL_Uniforms;
    vertexShader: string;
    fragmentShader: string;

    constructor(private gl: WebGL2RenderingContext, shader: Shader, defines: Record<string, any> = {}) {
        const program = gl.createProgram();
        this.program = program;

        const vs = gl.createShader(gl.VERTEX_SHADER);
        this.vertexShader = this.prefixVertShader(defines, shader.vertex);
        gl.shaderSource(vs, this.vertexShader);
        gl.compileShader(vs);

        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            const errorMessage = gl.getShaderInfoLog(vs);
            console.error("Vertex shader compilation error:");
            this.logShaderError(errorMessage, this.vertexShader);
            throw new Error(errorMessage);
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        this.fragmentShader = this.prefixFragShader(defines, shader.fragment);
        gl.shaderSource(fs, this.fragmentShader);
        gl.compileShader(fs);

        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            const errorMessage = gl.getShaderInfoLog(fs);
            console.error("Fragment shader compilation error:");
            this.logShaderError(errorMessage, this.fragmentShader);
            throw new Error(errorMessage);
        }

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const errorMessage = gl.getProgramInfoLog(program);
            console.error("Shader program linking error:");
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
        this.uniforms = this.fetchUniformLocations();
        this.attributes = this.fetchAttributeLocations();
    }

    private logShaderError(errorMessage: string, shaderSource: string) {
        const lines = shaderSource.split("\n");
        const errorLines = errorMessage.match(/ERROR: \d+:(\d+):/g);

        if (errorLines) {
            errorLines.forEach((errorLine) => {
                const lineNumber = parseInt(errorLine.match(/ERROR: \d+:(\d+):/)[1]);

                // Print the error context (3 lines before and after)
                const startLine = Math.max(0, lineNumber - 4);
                const endLine = Math.min(lines.length - 1, lineNumber + 2);

                console.error("\nError near line", lineNumber + ":");
                for (let i = startLine; i <= endLine; i++) {
                    const prefix = i === lineNumber - 1 ? "> " : "  ";
                    console.error(`${prefix}${i + 1}: ${lines[i]}`);
                }
            });
        }

        console.error("\nFull error message:", errorMessage);
    }

    private fetchUniformLocations() {
        const gl = this.gl;
        const program = this.program;
        const uniforms = new GL_Uniforms();
        const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        for (let i = 0; i < n; i++) {
            const info = gl.getActiveUniform(program, i),
                addr = gl.getUniformLocation(program, info.name);
            uniforms.appendUniform(info, addr);
        }

        return uniforms;
    }

    private fetchAttributeLocations() {
        const gl = this.gl;
        const program = this.program;
        const attributes = {};

        const n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

        for (let i = 0; i < n; i++) {
            const info = gl.getActiveAttrib(program, i);
            const name = info.name;

            let locationSize = 1;
            if (info.type === gl.FLOAT_MAT2) locationSize = 2;
            if (info.type === gl.FLOAT_MAT3) locationSize = 3;
            if (info.type === gl.FLOAT_MAT4) locationSize = 4;

            attributes[name] = {
                type: info.type,
                location: gl.getAttribLocation(program, name),
                locationSize: locationSize,
            };
        }

        return attributes;
    }

    setUniform(name, value, textures?: GL_Textures) {
        const glUniform = this.uniforms.map[name];
        if (glUniform) {
            glUniform.setValue(this.gl, value, textures);
        } else {
            // console.warn(`No glUniform found for uniform:${name}.`);
        }
    }

    prefixVertShader(defines, vertShader) {
        // prettier-ignore
        const prefixArray = []
        for (const key in defines) {
            prefixArray.push(`#define ${key}`);
        }
        const prefix = prefixArray.join("\n");
        const [_, content] = vertShader.split("#version 300 es\n");

        return "#version 300 es\n" + prefix + "\n" + content;
    }

    prefixFragShader(defines, fragShader) {
        // prettier-ignore
        const prefixArray = []
        for (const key in defines) {
            prefixArray.push(`#define ${key}`);
        }
        const prefix = prefixArray.join("\n");
        const [_, content] = fragShader.split("#version 300 es\n");

        return "#version 300 es\n" + prefix + "\n" + content;
    }

    drawElements(start: number, count: number) {
        const gl = this.gl;
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, start * Uint16Array.BYTES_PER_ELEMENT);
    }

    drawArray(start: number, count: number) {
        const gl = this.gl;
        gl.drawArrays(gl.TRIANGLES, start, count);
    }
}

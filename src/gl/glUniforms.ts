// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform

import { Texture } from "../core/texture";
import { GL_State } from "./glState";
import { GL_Textures } from "./glTextures";

export class GL_Uniforms {
    map: Record<string, UniformWrapper> = {};
    list: UniformWrapper[] = [];

    appendUniform(info: WebGLActiveInfo, addr: WebGLUniformLocation) {
        const namePath = info.name;

        let matches;

        // foo.bar
        if ((matches = namePath.match(/(\w+)\.(\w+)$/))) {
            const [_, id, field] = matches;
            const h = (this.map[id] || new GL_HierarchyUniformStructure(id)) as GL_HierarchyUniformStructure;
            const u = new GL_BareUniform(field, info, addr);
            h.map[field] = u;
            h.list.push(u);
            if (this.map[id] !== h) {
                this.map[id] = h;
                this.list.push(h);
            }
            // foo[0].bar
            // foo[1].bar
        } else if ((matches = namePath.match(/(\w+)\[(\d+)\]\.(\w+)$/))) {
            const [_, id, index, field] = matches;
            const h = (this.map[id] || new GL_HierarchyUniformStructure(id)) as GL_HierarchyUniformStructure;
            const hArray = (h.map[index] || new GL_HierarchyUniformStructure(+index)) as GL_HierarchyUniformStructure;

            if (this.map[id] !== h) {
                this.map[id] = h;
                this.list.push(h);
            }

            if (h.map[index] !== hArray) {
                h.map[index] = hArray;
                h.list.push(hArray);
            }

            const u = new GL_BareUniform(field, info, addr);

            hArray.map[+index] = u;
            hArray.list.push(u);

            // foo[0] <--- it will always be 0, no more else, see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
        } else if ((matches = namePath.match(/(\w+)\[(\d+)\]$/))) {
            const [_, id, index] = matches; // index is always 0, it is useless
            const u = new GL_BareArrayUniform(id, info, addr);
            this.map[id] = u;
            this.list.push(u);
            // foo
        } else if ((matches = namePath.match(/(\w+)$/))) {
            const [_, id] = matches;
            const u = new GL_BareUniform(id, info, addr);
            this.map[id] = u;
            this.list.push(u);
        }
    }
}

interface UniformWrapper {
    setValue(gl: WebGL2RenderingContext, v: any, textures?: GL_Textures): void;
}

// uniform vec4 a;
// a
class GL_BareUniform implements UniformWrapper {
    constructor(public name, public info, public addr) {}

    setValue(gl: WebGL2RenderingContext, v, v2) {
        const setter = getUniformFunction(gl, this.info.type);
        setter.call(gl, this.addr, v, v2);
    }
}

// uniform vec4 b[3];
// b[0]
// b[1]
// b[2]
export class GL_BareArrayUniform implements UniformWrapper {
    constructor(public index, public info, public addr) {}

    setValue(gl: WebGL2RenderingContext, v) {
        const setter = getUniformFunction(gl, this.info.type);

        // TODO: flatten

        if (Array.isArray(v) && v.length > 0) {
            if (typeof v[0] == "number") {
                // must be scalar
                setter.call(gl, this.addr, v);
            } else {
                // must be gl-matrix vec
                const flatten = new Float32Array(v.length * v[0].length);

                let offset = 0;
                for (let i = 0; i < v.length; i++) {
                    const vec = v[i];
                    flatten.set(vec, offset);
                    offset += vec.length;
                }

                setter.call(gl, this.addr, flatten);
            }
        } else {
            throw new Error("Invalid array value: " + v);
        }
    }
}

// uniform struct {
//     float foo;
//     vec4 bar;
// } c;
// c.foo
// c.bar

// uniform struct {
//     float foo;
//     vec4 bar;
// } d[2];
// d[0].foo
// d[0].bar
// d[1].foo
// d[1].bar

// uniform Block {
//     float bar;
// } e;
// e.bar
export class GL_HierarchyUniformStructure implements UniformWrapper {
    map: Record<string, UniformWrapper> = {};
    list: UniformWrapper[] = [];
    constructor(public id) {}

    setValue(gl: WebGL2RenderingContext, v: any): void {
        for (const key of Object.keys(v)) {
            const uniform = this.map[key];

            if (uniform == undefined) {
                throw new Error("Missing required glsl struct field: " + key);
            }

            uniform.setValue(gl, v[key]);
        }
    }
}

// uniform Block {
//     vec4 a;
// };
// a
// ???
function getUniformFunction(gl: WebGL2RenderingContext, type) {
    switch (type) {
        case gl.FLOAT:
            return gl.uniform1f;
        case gl.FLOAT_VEC2:
            return gl.uniform2fv;
        case gl.FLOAT_VEC3:
            return gl.uniform3fv;
        case gl.FLOAT_VEC4:
            return gl.uniform4fv;
        case gl.INT:
            return gl.uniform1i;
        case gl.INT_VEC2:
            return gl.uniform2iv;
        case gl.INT_VEC3:
            return gl.uniform3iv;
        case gl.INT_VEC4:
            return gl.uniform4iv;
        case gl.BOOL:
            return gl.uniform1i;
        case gl.BOOL_VEC2:
            return gl.uniform2iv;
        case gl.BOOL_VEC3:
            return gl.uniform3iv;
        case gl.BOOL_VEC4:
            return gl.uniform4iv;
        case gl.FLOAT_MAT2:
            return function (addr, v) {
                gl.uniformMatrix2fv(addr, false, v);
            };
        case gl.FLOAT_MAT3:
            return function (addr, v) {
                gl.uniformMatrix3fv(addr, false, v);
            };
        case gl.FLOAT_MAT4:
            return function (addr, v) {
                gl.uniformMatrix4fv(addr, false, v);
            };
        case gl.SAMPLER_2D:
            return function (addr, texture: Texture, textures: GL_Textures) {
                const unit = textures.allocTextureUnit(texture);
                gl.uniform1i(addr, unit);
                textures.uploadTexture(texture, unit);
            };
        case gl.SAMPLER_CUBE:
            return function (addr, texture: Texture, textures: GL_Textures) {
                const unit = textures.allocTextureUnit(texture);
                gl.uniform1i(addr, unit);
                textures.uploadTexture(texture, unit);
            };
        default:
            throw new Error(`Unsupported uniform type: ${type}`);
    }
}

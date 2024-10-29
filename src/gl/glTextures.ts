import { Texture } from "../core/texture";
import { DataTexture } from "../textures/DataTexture";
import { DepthTexture } from "../textures/DepthTexture";
import { GL_ConstantsMapping } from "./glConstantsMapping";
import { GL_State } from "./glState";

export class GL_Textures {
    unit = 0;
    textures = new Map();
    textureToUnits = new Map();
    unitToTexLocations = new Map();
    constructor(
        private gl: WebGL2RenderingContext,
        private constantsMapping: GL_ConstantsMapping,
        public state: GL_State
    ) {}

    allocTextureUnit(texture: Texture) {
        const unit = this.unit++;
        this.textureToUnits.set(texture, unit);
        return unit;
    }

    resetTextureUnit() {
        this.unit = 0;
        this.textureToUnits.clear();
    }

    getTextureLocation(texture: Texture) {
        if (!this.textures.has(texture)) {
            throw new Error("texture not init");
        }
        return this.textures.get(texture);
    }

    initTexture(texture: Texture) {
        const gl = this.gl;
        if (!this.textures.has(texture)) {
            const texLocation = gl.createTexture();
            this.textures.set(texture, texLocation);
        }

        if (texture.isDirty) {
            // it is safe to always init texture at unit 0
            const texLocation = this.textures.get(texture);
            this.state.bindTexture(0, texLocation);

            if (texture.image != null) {
                const { width, height } = texture.image;
                const { wrapS, wrapT, magFilter, minFilter, format, type } = this.getGLTextureParams(texture.param);

                if (texture instanceof DataTexture) {
                    // TODO: precisure internalFormat, see three.js WebGLTexture getInternalFormat function
                    let internalFormat = format;
                    if (format === gl.RGBA) {
                        if (type === gl.HALF_FLOAT) {
                            internalFormat = gl.RGBA16F;
                        } else if (type === gl.FLOAT) {
                            // FIXME: gl.RGBA32F not supported in my m1 macmini
                            // internalFormat = gl.RGBA32F;
                            internalFormat = gl.RGBA16F;
                        }
                    }
                    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, texture.image.data);
                } else if (texture.isDepthTexture) {
                    // TODO: precisure internalFormat
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, width, height, 0, format, type, null);
                } else if (texture.isRenderTargetTexture) {
                    // must be called for rendertarget texture
                    gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, null);
                } else if (texture.image instanceof Image) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, texture.image);
                }
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
            }
            texture.isDirty = false;
        }

        const glTexture = this.textures.get(texture);
        return glTexture;
    }

    uploadTexture(texture: Texture, unit: number) {
        this.initTexture(texture);

        const texLocation = this.getTextureLocation(texture);

        const currentBoundTex = this.unitToTexLocations.get(unit);
        if (currentBoundTex === texLocation) {
            return;
        }

        this.state.bindTexture(unit, texLocation);

        this.unitToTexLocations.set(unit, texLocation);
    }

    private getGLTextureParams<T extends object>(params: T) {
        const glPrams: T = { ...params };
        for (const key of Object.keys(params)) {
            const value = params[key];
            const glValue = this.constantsMapping.getGLConstant(value);

            glPrams[key] = glValue;
        }
        return glPrams;
    }

    // TODO: gpu texture format
}

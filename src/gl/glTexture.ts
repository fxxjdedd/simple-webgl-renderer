export interface GL_TextureImage {
    width: number;
    height: number;
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
export interface GL_TextureParam {
    wrapS: number;
    wrapT: number;
    magFilter: number;
    minFilter: number;
    format: number;
    type: number;
}
export class GL_Texture {
    static unit = 0;
    static cache = new Map();

    static AllocTextureUnit(texture: GL_Texture) {
        if (this.cache.has(texture)) {
            return this.cache.get(texture);
        }
        this.cache.set(texture, GL_Texture.unit++);
        return this.cache.get(texture);
    }

    static ResetTextureUnit() {
        GL_Texture.unit = 0;
        this.cache.clear();
    }

    texture: WebGLTexture;
    unit: number = 0;
    isDepthTexture = false;
    constructor(public image: GL_TextureImage, public params: GL_TextureParam) {}

    init(gl: WebGL2RenderingContext) {
        const { wrapS, wrapT, magFilter, minFilter, format, type } = this.params;

        if (!this.texture) {
            this.texture = gl.createTexture();

            this.unit = GL_Texture.AllocTextureUnit(this);

            gl.activeTexture(gl.TEXTURE0 + this.unit);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                this.getInternalFormat(gl, format),
                this.image.width,
                this.image.height,
                0,
                format,
                type,
                null
            );

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
        }
    }

    // TODO: gpu texture format
    getInternalFormat(gl: WebGL2RenderingContext, format) {
        // webgl2 must use DEPTH_COMPONENT<Num>
        if (this.isDepthTexture) {
            return gl.DEPTH_COMPONENT16;
        }
        return format;
    }
}

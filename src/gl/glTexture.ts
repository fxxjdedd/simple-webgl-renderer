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
    texture: WebGLTexture;
    constructor(public image: GL_TextureImage, public params: GL_TextureParam) {}

    initGL(gl: WebGL2RenderingContext) {
        if (this.texture) return;

        const { wrapS, wrapT, magFilter, minFilter, format, type } = this.params;

        this.texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            this.getInternalFormat(gl),
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

    // TODO: gpu texture format
    getInternalFormat(gl: WebGL2RenderingContext) {
        return gl.RGBA;
    }
}

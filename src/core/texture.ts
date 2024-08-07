export interface TextureImage {
    width: number;
    height: number;
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
export interface TextureParam {
    wrapS: number;
    wrapT: number;
    magFilter: number;
    minFilter: number;
    format: number;
    type: number;
}
export class Texture {
    isDepthTexture: boolean = false; // temporary
    isRenderTargetTexture: boolean = false;
    constructor(public image: TextureImage, public param: TextureParam) {}
}

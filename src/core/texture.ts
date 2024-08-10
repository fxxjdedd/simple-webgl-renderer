import { ClampToEdgeWrapping, LinearFilter, RGBAFormat, RepeatWrapping, UnsignedByteType } from "../constants";

export interface TextureImage {
    width: number;
    height: number;
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
export interface TextureParam {
    wrapS?: number;
    wrapT?: number;
    magFilter?: number;
    minFilter?: number;
    format?: number;
    type?: number;
}
export class Texture {
    isDirty = true;
    isDepthTexture: boolean = false; // temporary
    isRenderTargetTexture: boolean = false;
    constructor(public image?: TextureImage, public param?: TextureParam) {
        this.image ??= null;
        this.param = {
            ...{
                wrapS: ClampToEdgeWrapping,
                wrapT: ClampToEdgeWrapping,
                magFilter: LinearFilter,
                minFilter: LinearFilter,
                format: RGBAFormat,
                type: UnsignedByteType,
            },
            ...param,
        };
    }
}

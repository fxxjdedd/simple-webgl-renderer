import {
    ClampToEdgeWrapping,
    LinearFilter,
    NearestFilter,
    RGBAFormat,
    UnsignedByteType,
    UnsignedIntType,
} from "../constants";
import { Texture } from "../core/texture";

export class DataTexture extends Texture {
    constructor(data, width, height, format = RGBAFormat, type = UnsignedByteType) {
        super(null, {
            wrapS: ClampToEdgeWrapping,
            wrapT: ClampToEdgeWrapping,
            // must use nearest
            // https://stackoverflow.com/questions/17707638/getting-black-color-from-depth-buffer-in-open-gl-es-2-0
            magFilter: LinearFilter,
            minFilter: LinearFilter,
            format,
            type,
        });
        this.image = {
            data,
            width,
            height,
        };
    }
}

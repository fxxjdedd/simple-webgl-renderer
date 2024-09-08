import {
    ClampToEdgeWrapping,
    DepthFormat,
    FloatType,
    HalfFloatType,
    LinearFilter,
    NearestFilter,
    RGBAFormat,
    RGBFormat,
    RepeatWrapping,
    UnsignedByteType,
    UnsignedIntType,
} from "../constants";

export class GL_ConstantsMapping {
    mappings = {};
    constructor(private gl: WebGL2RenderingContext) {
        this.mappings = {
            // wrapping
            [RepeatWrapping]: this.gl.REPEAT,
            [ClampToEdgeWrapping]: this.gl.CLAMP_TO_EDGE,
            // filter
            [LinearFilter]: this.gl.LINEAR,
            [NearestFilter]: this.gl.NEAREST,
            // format
            [RGBFormat]: gl.RGB,
            [RGBAFormat]: gl.RGBA,
            [DepthFormat]: gl.DEPTH_COMPONENT,

            // type
            [UnsignedByteType]: gl.UNSIGNED_BYTE,
            [UnsignedIntType]: gl.UNSIGNED_INT,
            [HalfFloatType]: gl.HALF_FLOAT,
            [FloatType]: gl.FLOAT,
        };
    }

    getGLConstant(constant: number) {
        const glConstant = this.mappings[constant];
        if (glConstant == undefined) {
            throw new Error("Missing gl constant: " + constant);
        }
        return glConstant;
    }
}

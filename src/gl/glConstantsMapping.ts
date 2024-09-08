import {
    AddEquation,
    ClampToEdgeWrapping,
    DepthFormat,
    DstAlphaFactor,
    DstColorFactor,
    FloatType,
    HalfFloatType,
    LinearFilter,
    NearestFilter,
    OneFactor,
    OneMinusDstAlphaFactor,
    OneMinusSrcAlphaFactor,
    OneMinusSrcColorFactor,
    RGBAFormat,
    RGBFormat,
    RepeatWrapping,
    SrcAlphaFactor,
    SrcColorFactor,
    UnsignedByteType,
    UnsignedIntType,
    ZeroFactor,
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

            // blending
            [AddEquation]: this.gl.FUNC_ADD,
            [ZeroFactor]: this.gl.ZERO,
            [OneFactor]: this.gl.ONE,
            [SrcColorFactor]: this.gl.SRC_COLOR,
            [DstColorFactor]: this.gl.DST_COLOR,
            [OneMinusSrcColorFactor]: this.gl.ONE_MINUS_SRC_COLOR,
            [SrcAlphaFactor]: this.gl.SRC_ALPHA,
            [OneMinusSrcAlphaFactor]: this.gl.ONE_MINUS_SRC_ALPHA,
            [DstAlphaFactor]: this.gl.DST_ALPHA,
            [OneMinusDstAlphaFactor]: this.gl.ONE_MINUS_DST_ALPHA,
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

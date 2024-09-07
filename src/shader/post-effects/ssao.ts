import packing from "../chunks/packing";

export function getDefines() {
    return {
        KERNEL_SIZE: 32,
    };
}

export function getUniforms() {
    return {
        kernels: { value: [] },
    };
}

export const vertex = /* glsl */ `#version 300 es
    precision highp float;
	#pragma vscode_glsllint_stage : vert //pragma to set STAGE to 'vert'

    in vec3 position;

    uniform mat4 projMatrix;
    uniform mat4 mvMatrix;

	void main() {
        gl_Position = projMatrix * mvMatrix * vec4(position, 1.0);
	}
`;

export const fragment = /* glsl */ `#version 300 es
	precision highp float;
	#pragma vscode_glsllint_stage : frag //pragma to set STAGE to 'frag'

#ifdef KERNEL_SIZE // just for skip glsl validtor
    uniform int kernals[KERNEL_SIZE];
#endif

	uniform sampler2D g_diffuse;
	uniform sampler2D g_normal;
	uniform sampler2D g_depth;

    uniform viewport;

    out vec4 fragColor;

    ${packing}

	void main() {
		highp vec2 uv = (gl_FragCoord.xy - viewport.xy)/viewport.zw;
		float depth = unpackRGBAToDepth(texture(g_depth, uv));

        fragColor = vec4(vec3(depth), 1.0);
	}
`;

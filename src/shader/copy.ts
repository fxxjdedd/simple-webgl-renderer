export function getDefines() {
    return {};
}

export function getUniforms() {
    return {};
}

export const vertex = /* glsl */ `#version 300 es
    precision highp float;
	#pragma vscode_glsllint_stage : vert //pragma to set STAGE to 'vert'

    in vec3 position;

	void main() {
        gl_Position = vec4(position, 1.0);
	}
`;

export const fragment = /* glsl */ `#version 300 es
	precision highp float;
	#pragma vscode_glsllint_stage : frag //pragma to set STAGE to 'frag'

    uniform sampler2D map;
    uniform vec4 viewport;

	out vec4 fragColor;

	void main() {
		highp vec2 uv = (gl_FragCoord.xy - viewport.xy)/viewport.zw;
        vec4 color = texture(map, uv);
        fragColor = color;
	}
`;

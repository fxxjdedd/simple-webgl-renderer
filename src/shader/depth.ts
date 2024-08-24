export const vertex = /* glsl */ `#version 300 es
    precision highp float;
	#pragma vscode_glsllint_stage : vert //pragma to set STAGE to 'vert'

	in vec3 position;
	in vec3 normal;
	in vec2 uv;

    uniform mat4 projMatrix;
	uniform mat4 mvMatrix;
	uniform mat4 modelMatrix;

    out vec3 v_pos;

	void main() {
		vec4 worldPos = modelMatrix * vec4(position, 1.0);
		v_pos = worldPos.xyz;
        // NOTE: just make attrib active
        gl_Position = vec4(normal, 1.0);
        gl_Position = vec4(uv, 1.0, 1.0);
		gl_Position = projMatrix * mvMatrix * vec4(position, 1.0);
	}
`;

export const fragment = /* glsl */ `#version 300 es
	precision highp float;
	#pragma vscode_glsllint_stage : frag //pragma to set STAGE to 'frag'

    in vec3 v_pos;

    layout(location = 0) out vec4 depthMap;

	void main() {
        // already 0-1
        depthMap = vec4(vec3(gl_FragCoord.z), 1.0);
	}
`;

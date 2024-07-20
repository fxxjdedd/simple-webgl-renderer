export const vertex = /* glsl */ `#version 300 es
	precision highp float;
	#pragma vscode_glsllint_stage : vert //pragma to set STAGE to 'vert'

	in vec3 position;
	in vec3 normal;
	in vec2 uv;

	uniform mat4 u_projMatrix;
	uniform mat4 u_mvMatrix;

	out vec3 v_normal;
	out vec2 v_uv;

	void main() {
		gl_Position = u_projMatrix * u_mvMatrix * vec4(position, 1.0);
		v_normal = mat3(u_mvMatrix) * normal;
		v_uv = uv;
	}
`;

export const fragment = /* glsl */ `#version 300 es
	precision highp float;
	#pragma vscode_glsllint_stage : frag //pragma to set STAGE to 'frag'

	in vec3 v_normal;
	in vec2 v_uv;

	uniform sampler2D g_diffuse;
	uniform sampler2D g_normal;

	out vec4 fragColor;

	void main() {
		fragColor = texture(g_diffuse, v_uv);
		fragColor = texture(g_normal, v_uv);
		fragColor = vec4(1.0,.0,.0, 1.0);
	}
`;

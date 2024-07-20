export const vertex = /* glsl */ `#version 300 es
	#pragma vscode_glsllint_stage : vert //pragma to set STAGE to 'vert'

	in vec3 position;
	in vec3 normal;
	in vec2 uv;

	uniform mat4 u_projMatrix;
	uniform mat4 u_mvMatrix;

	out vec3 v_normal;
	out highp vec2 v_uv;

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
	in highp vec2 v_uv;

	layout(location = 0) out vec4 g_diffuse;
	layout(location = 1) out vec4 g_normal;


	void main() {
		g_diffuse = vec4(0.5, 0.0, 0.0, 1.0);
		g_normal = vec4(0.0, 0.5, 0.0, 1.0);
	}
`;

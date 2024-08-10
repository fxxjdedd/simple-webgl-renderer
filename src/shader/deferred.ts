export const vertex = /* glsl */ `#version 300 es
    precision highp float;
	#pragma vscode_glsllint_stage : vert //pragma to set STAGE to 'vert'

	in vec3 position;
	in vec3 normal;
	in vec2 uv;

	uniform mat4 projMatrix;
	uniform mat4 mvMatrix;
	uniform mat4 modelMatrix;
	uniform mat3 normalMatrix;

	out vec3 v_pos;
	out vec3 v_normal;
	out vec2 v_uv;

	void main() {
		vec4 worldPos = modelMatrix * vec4(position, 1.0);
		v_pos = worldPos.xyz;
		// http://www.lighthouse3d.com/tutorials/glsl-12-tutorial/the-normal-matrix/
		v_normal = normalMatrix * normal;
		v_uv = uv;
		gl_Position = projMatrix * mvMatrix * vec4(position, 1.0);
	}
`;

export const fragment = /* glsl */ `#version 300 es
	precision highp float;
	#pragma vscode_glsllint_stage : frag //pragma to set STAGE to 'frag'

	in vec3 v_pos;
	in vec3 v_normal;
	in vec2 v_uv;

	layout(location = 0) out vec4 g_diffuse;
	layout(location = 1) out vec4 g_normal;
	layout(location = 2) out vec4 g_pos;

	void main() {

		g_diffuse = vec4(0.0, 0.5, 0.0, 1.0);
		// texture color is range from 0 to 1, so we must have a conversion
		g_normal = vec4((v_normal + 1.0) / 2.0, 1.0);
		g_pos = vec4((v_pos + 1.0) / 2.0, 1.0);
	}
`;

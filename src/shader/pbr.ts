export const vertex = /* glsl */ `#version 300 es
	precision highp float;
	#pragma vscode_glsllint_stage : vert //pragma to set STAGE to 'vert'

	in vec3 position;
	in vec3 normal;
	in vec2 uv;

	uniform mat4 projMatrix;
	uniform mat4 mvMatrix;

	out vec3 v_normal;
	out vec2 v_uv;

	void main() {
		gl_Position = projMatrix * mvMatrix * vec4(position, 1.0);
		v_normal = mat3(mvMatrix) * normal;
		v_uv = uv;
	}
`;

export const fragment = /* glsl */ `#version 300 es
	precision highp float;
	#pragma vscode_glsllint_stage : frag //pragma to set STAGE to 'frag'

	in vec3 v_normal;
	in vec2 v_uv;

	uniform mat4 projMatrix;
	uniform vec4 viewport;
	uniform bool useLinearDepth;

	uniform sampler2D g_pos;
	uniform sampler2D g_diffuse;
	uniform sampler2D g_normal;
	uniform sampler2D g_depth;

	out vec4 fragColor;


	float ToLinearDepth(float depth) {
		float ndc = depth * 2.0 - 1.0; 
		// https://stackoverflow.com/questions/56428880/how-to-extract-camera-parameters-from-projection-matrix
		float near = projMatrix[3][2]/(projMatrix[2][2] - 1.0);
		float far = projMatrix[2][3]/(projMatrix[2][2] + 1.0);
		float linearDepth = (2.0 * near * far) / (far + near - ndc * (far - near));	
		return linearDepth;
	}

	void main() {
		vec2 uv = (gl_FragCoord.xy - viewport.xy)/viewport.zw;

		float depth = texture(g_depth, uv).r;
		if (useLinearDepth) {
			depth = ToLinearDepth(depth);
		}
		fragColor = texture(g_diffuse, uv);
		fragColor = texture(g_normal, uv);
		fragColor = texture(g_pos, uv);

		// fragColor = vec4(vec3(depth), 1.0);
	}
`;

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

	in vec2 v_uv;

	struct DirLight {
		vec3 direction;
		vec3 color;
		float intensity;
	};

	uniform mat4 projMatrix;
	uniform vec4 viewport;

	uniform DirLight dirLight;

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
		highp vec2 uv = (gl_FragCoord.xy - viewport.xy)/viewport.zw;

		float depth = texture(g_depth, uv).r;
		depth = ToLinearDepth(depth);

		vec4 diffuse = texture(g_diffuse, uv);
		vec3 normal = texture(g_normal, uv).xyz * 2.0 - 1.0;
		vec3 pos = texture(g_pos, uv).xyz * 2.0 - 1.0;


		float dtLN = max(dot(normal, normalize(dirLight.direction)), 0.0);

		vec4 dirLightColor = vec4(dtLN * dirLight.color * dirLight.intensity, 1.0);

		vec4 ambient = vec4(1.0,1.0,1.0,1.0);
		diffuse *= (dirLightColor + ambient*0.1);

		fragColor = diffuse;
	}
`;

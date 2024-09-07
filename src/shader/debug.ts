import packing from "./chunks/packing";

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

	uniform mat4 projMatrix;
	uniform mat4 mvMatrix;

	uniform vec4 viewport;
	uniform float adaptiveAspectRatio;
	uniform sampler2D map;
	
	out vec4 fragColor;


	float ToLinearDepth(float depth) {
		float ndc = depth * 2.0 - 1.0; 
		// https://stackoverflow.com/questions/56428880/how-to-extract-camera-parameters-from-projection-matrix
		float near = projMatrix[3][2]/(projMatrix[2][2] - 1.0);
		float far = projMatrix[2][3]/(projMatrix[2][2] + 1.0);
		float linearDepth = (2.0 * near * far) / (far + near - ndc * (far - near));	
		return linearDepth;
	}

#ifdef IS_PACKED_DEPTH_MAP
    ${packing}
#endif
	void main() {
		// vec2 uv = (gl_FragCoord.xy - viewport.xy)/viewport.zw;

		vec2 center = viewport.xy + viewport.zw / 2.0;

		// first normalize to -0.5 to 0.5
		vec2 uv = (gl_FragCoord.xy - center) / min(viewport.z, viewport.w);
		// then scale by adaptiveAspectRatio
		uv.x *= adaptiveAspectRatio;
		// finally normalize to 0 to 1
		uv = uv + 0.5;

#ifdef IS_DEPTH_MAP
		float depth = unpackRGBAToDepth(texture(map, uv));
		fragColor = vec4(vec3(1.0 - depth), 1.0);
#elif defined(IS_PACKED_DEPTH_MAP)
		float depth = texture(map, uv).r;
		depth = ToLinearDepth(depth);
		fragColor = vec4(vec3(1.0 - depth), 1.0);
#else
		fragColor = texture(map, uv);
#endif
	}
`;

import packing from "./chunks/packing";

export const vertex = /* glsl */ `#version 300 es
    precision highp float;
	#pragma vscode_glsllint_stage : vert //pragma to set STAGE to 'vert'

	in vec3 position;
	in vec3 normal;

	uniform mat4 projMatrix;
	uniform mat4 mvMatrix;
	uniform mat4 modelMatrix;
	uniform mat3 normalMatrix;

	out vec3 v_normal;
	out vec3 v_pos;

	void main() {
		vec4 worldPos = modelMatrix * vec4(position, 1.0);
		v_pos = worldPos.xyz;
		v_normal = normalMatrix * normal;
		gl_Position = projMatrix * mvMatrix * vec4(position, 1.0);
	}
`;

export const fragment = /* glsl */ `#version 300 es
	precision highp float;
	#pragma vscode_glsllint_stage : frag //pragma to set STAGE to 'frag'

	in vec3 v_pos;
	in vec3 v_normal;

	layout(location = 0) out vec4 fragColor;
#ifdef USE_NORMAL_MAP
	uniform sampler2D normalMap;
#endif

	uniform mat4 viewMatrix;
	uniform mat4 projMatrix;

	${packing}

	void main() {
		vec4 posInEye = viewMatrix * vec4(v_pos, 1.0);

		// NOTE: here we use v_uv to sample from normal texture
#ifdef USE_NORMAL_MAP
		vec3 mapNormal = unpackTangentNormalMap(normalMap, v_uv, posInEye.xyz, v_normal);
		// texture color is range from 0 to 1, so we must have a conversion
		fragColor = vec4((mapNormal + 1.0) / 2.0, 1.0);
#else
		fragColor = vec4((v_normal + 1.0) / 2.0, 1.0);
#endif
	}
`;

import packingChunk from "./chunks/packing";

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
    out vec2 v_fragZW;

	void main() {
		vec4 worldPos = modelMatrix * vec4(position, 1.0);
		v_pos = worldPos.xyz;
		// http://www.lighthouse3d.com/tutorials/glsl-12-tutorial/the-normal-matrix/
		// v_normal = normalize((mvMatrix * vec4(normal, 1.0)).xyz);
		v_normal = normalize(normalMatrix * normal);
		v_uv = uv;
		gl_Position = projMatrix * mvMatrix * vec4(position, 1.0);
        v_fragZW = gl_Position.zw;
	}
`;

export const fragment = /* glsl */ `#version 300 es
	precision highp float;
	#pragma vscode_glsllint_stage : frag //pragma to set STAGE to 'frag'

	in vec3 v_pos;
	in vec3 v_normal;
	in vec2 v_uv;
    in vec2 v_fragZW;

	layout(location = 0) out vec4 g_diffuse;
	layout(location = 1) out vec4 g_normal;
	layout(location = 2) out vec4 g_depth;

#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_NORMAL_MAP
	uniform sampler2D normalMap;
#endif
	uniform vec4 diffuse;

	uniform mat4 viewMatrix;
	uniform mat4 projMatrix;

	${packingChunk}

	void main() {

		vec4 posInEye = viewMatrix * vec4(v_pos, 1.0);

		// NOTE: here we use v_uv to sample from normal texture
#ifdef USE_NORMAL_MAP
		vec3 mapNormal = unpackTangentNormalMap(normalMap, v_uv, posInEye.xyz, v_normal);
		// texture color is range from 0 to 1, so we must have a conversion
		g_normal = vec4((mapNormal + 1.0) / 2.0, 1.0);
#else
		g_normal = vec4((v_normal+ 1.0) / 2.0, 1.0);
#endif

#ifdef USE_MAP
		g_diffuse = texture(map, vec2(v_uv.x, 1.0 - v_uv.y));
#else
		g_diffuse = diffuse;
#endif

        float depth = 0.5 * v_fragZW.x / v_fragZW.y + 0.5;
        g_depth = packDepthToRGBA(depth);
	}
`;

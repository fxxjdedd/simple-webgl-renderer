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
		// v_normal = normal;
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

	uniform sampler2D map;
	uniform sampler2D normalMap;
	uniform vec4 diffuse;

	uniform mat4 viewMatrix;

	vec3 UnpackNormal(sampler2D normalMap, vec2 uv, vec3 surfPosInEye, vec3 surfNormal) {
		vec3 nColor = texture(normalMap, uv).xyz;
		vec3 nValue = nColor * 2.0 - 1.0;
		vec3 dPosX = dFdx(surfPosInEye);
		vec3 dPosY = dFdy(surfPosInEye);
		vec2 dUvX = dFdx(uv);
		vec2 dUvY = dFdy(uv);

		vec3 S = normalize( dPosX * dUvY.y - dPosY * dUvX.y );
		vec3 T = normalize( -dPosX * dUvY.x + dPosY * dUvX.x );
		vec3 N = normalize( surfNormal );
    
		mat3 tsn = mat3( S, T, N );
		return normalize( tsn * nValue );
	}

	void main() {

		vec4 posInEye = viewMatrix * vec4(v_pos, 1.0);
		// NOTE: here we use v_uv to sample from normal texture
#ifdef USE_NORMAL_MAP
		vec3 mapNormal = UnpackNormal(normalMap, v_uv, -posInEye.xyz, v_normal);
		// texture color is range from 0 to 1, so we must have a conversion
		g_normal = vec4((mapNormal + 1.0) / 2.0, 1.0);
#else
		g_normal = vec4((v_normal + 1.0) / 2.0, 1.0);
#endif
		g_diffuse = texture(map, v_uv) * diffuse;
		g_pos = vec4((v_pos + 1.0) / 2.0, 1.0);
	}
`;

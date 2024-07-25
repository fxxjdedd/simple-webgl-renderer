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

	uniform vec4 viewport;

	uniform mat4 projMatrix;
	uniform mat4 mvMatrix;
	uniform mat4 viewMatrix;
	uniform mat4 modelMatrix;

	in vec3 v_normal;
	in vec2 v_uv;

	out vec4 fragColor;
    uniform sampler2D map;

    vec4 ScreenToLocal(vec4 fragCoord) {
		vec2 uv = (gl_FragCoord.xy - viewport.xy)/viewport.zw;
        float z = fragCoord.z;
        float w = fragCoord.w;
        vec2 ndcXY = uv*2.0 - 1.0;
        float ndcZ = z * 2.0 - 1.0;
        vec4 ndc = vec4(ndcXY, ndcZ, 1.0);
        vec4 clip = ndc / w; // gl_FragCoord.w is 1/clip.w
        vec4 view = inverse(projMatrix) * clip;
        vec4 local = inverse(mvMatrix) * view;
        return local;
    }

	void main() {

		vec2 uv = (gl_FragCoord.xy - viewport.xy)/viewport.zw;
        vec4 local = ScreenToLocal(gl_FragCoord);
        vec4 newClip = projMatrix * viewMatrix * local;
        vec4 newNDC = newClip / newClip.w;
		vec2 newUV = (newNDC.xy + 1.0) / 2.0; 

		fragColor = texture(map, newUV);
	}
`;

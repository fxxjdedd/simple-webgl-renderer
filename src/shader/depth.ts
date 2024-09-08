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

    out vec3 v_pos;
    out float v_depth;
    out vec2 v_fragZW;

	void main() {
		vec4 worldPos = modelMatrix * vec4(position, 1.0);
		v_pos = worldPos.xyz;
        // NOTE: just make attrib active
        gl_Position = vec4(normal, 1.0);
        gl_Position = vec4(uv, 1.0, 1.0);
		gl_Position = projMatrix * mvMatrix * vec4(position, 1.0);
        v_depth = 1.0 + gl_Position.w; // w is -eye.z
        v_fragZW = gl_Position.zw;
	}
`;

export const fragment = /* glsl */ `#version 300 es
	precision highp float;
	#pragma vscode_glsllint_stage : frag //pragma to set STAGE to 'frag'

    in vec3 v_pos;
    in float v_depth;
    in vec2 v_fragZW;

    uniform float logDepthFactor;

    layout(location = 0) out vec4 depthColor; // cause renderTarget must have at least one color texture

    ${packingChunk}

	void main() {
        // comment cause not need at now
        // gl_FragDepth = log2(v_depth) * logDepthFactor * 0.5;

        // see: https://github.com/mrdoob/three.js/issues/9092
        float depth = 0.5 * v_fragZW.x / v_fragZW.y + 0.5;
        depthColor = packDepthToRGBA(depth);
	}
`;

import depthChunk from "../chunks/depth";
import packingChunk from "../chunks/packing";
import ssChunk from "../chunks/ss";
export function getDefines() {
    return {
        KERNEL_SIZE: 32,
    };
}

export function getUniforms() {
    return {
        kernels: { value: [] },
    };
}

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
    // TODO: currently we dont have shader compile phase, so the kernels have to be explicit at now
    // the error is: implicitly sized arrays only allowed for tessellation shaders or geometry shader inputs
    const int KERNEL_SIZE_TEMP = 32;
    uniform vec3 kernels[KERNEL_SIZE_TEMP];
    uniform float kernelRadius;
    uniform float minDistance;
    uniform float maxDistance;

	uniform sampler2D g_diffuse;
	uniform sampler2D g_normal;
	uniform sampler2D g_depth;
	uniform sampler2D noiseMap;

    uniform vec4 viewport;
    uniform mat4 projMatrix;
    uniform mat4 mvMatrix;

    out vec4 fragColor;

    ${depthChunk}
    ${packingChunk}
    ${ssChunk}

	void main() {
		highp vec2 uv = (gl_FragCoord.xy - viewport.xy)/viewport.zw;
		float depth = unpackRGBAToDepth(texture(g_depth, uv));
        vec3 normalView = texture(g_normal, uv).xyz * 2.0 - 1.0;

        vec3 posView = uvDepthToViewPos(uv, depth);

        vec3 random = texture(noiseMap, uv).xyz; 

        vec3 t = normalize(random - normalView * dot(random, normalView));
        vec3 b = cross(normalView, t);
        mat3 tbnMatrix = mat3(t, b, normalView);

        float occlusion = 0.0;

        for (int i = 0; i < KERNEL_SIZE_TEMP; i++) {
            vec3 samplerDir = tbnMatrix * kernels[i];
            vec3 samplerPos = posView + (samplerDir * kernelRadius);
            vec3 samplerPosInUVDepth = viewPosToUvDepth(samplerPos);

            float samplerDepth = samplerPosInUVDepth.z;
            float samplerLinearDepth = toLinearDepth(samplerDepth);

		    float sampledFragDepth = unpackRGBAToDepth(texture(g_depth, samplerPosInUVDepth.xy));
            // TODO: support ortho proj
            float sampledFragDepthLinear = toLinearDepth(sampledFragDepth);
            
            float delta = samplerLinearDepth - sampledFragDepthLinear;

            if (delta > minDistance && delta < maxDistance) {
                occlusion += 1.0;
            }

        }

        occlusion = clamp((occlusion / float(KERNEL_SIZE_TEMP)), 0.0, 1.0);
        fragColor = vec4(vec3(1.0 - occlusion), 1.0);

	}

`;

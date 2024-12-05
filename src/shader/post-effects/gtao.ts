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

	#define PI 3.1415926535897932384632

    uniform int directionCount;
    uniform int sampleStepCount;

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
        vec3 viewNormal = texture(g_normal, uv).xyz * 2.0 - 1.0;

        vec3 posView = uvDepthToViewPos(uv, depth);

        // ref: https://www.activision.com/cdn/research/Practical_Real_Time_Strategies_for_Accurate_Indirect_Occlusion_NEW%20VERSION_COLOR.pdf
        //      Algorithm 1 Computes the ambient occlusion term A(x).
        vec3 random = texture(noiseMap, uv).xyz * 2.0 - 1.0;
        vec3 cameraSpaceNormal = vec3(0., 0., 1.0);
        vec3 cameraSpaceTangent = normalize(random - cameraSpaceNormal * dot(random, cameraSpaceNormal));
        vec3 cameraSpaceBitangent = cross(cameraSpaceNormal, cameraSpaceTangent);
        mat3 cameraTBN = mat3(cameraSpaceTangent, cameraSpaceBitangent, cameraSpaceNormal);
        // ref line 1
        vec3 Wo = normalize(-posView);
        float visibility = 0.0;
        for (int i = 0; i < directionCount; i ++) {
            // ref line 5
            float phi = (float(i) / float(directionCount)) * PI; // NOTE: phi is defined in cameraSpace
            // ref line 6,8
            vec3 D = vec3(sin(phi), cos(phi), 0.0); // in cameraSpace
            D = normalize(cameraTBN * D); // convert D from cameraSpace to viewSpace
            // ref line 10
            vec3 Wy = normalize(cross(D, Wo)); // Wy is bitangent of slice plane, aka, the normal of slice plane
            // ref line 9: same as vec3 orthD = normalize(D - Wo*(dot(D, Wo)))
            vec3 Wx = normalize(cross(Wy, Wo)); // Wx is tagnent
            // ref line 11
            vec3 projNormalInPlane = normalize(viewNormal - Wy*(dot(viewNormal, Wy))); // project viewNormal onto slice space

            // ref line 13,14,15
            float projNormalSign = sign(dot(projNormalInPlane, Wx));
            float projNormalCos = clamp(dot(projNormalInPlane, Wo) / length(projNormalInPlane), 0.0, 1.0);
            float projNormalTheta = projNormalSign * acos(projNormalCos);

            // ref line 17
            for (int side = 0; side < 2; side ++) {
                float sideCoef = float(side) * 2.0 - 1.0;
                float cosHorizontal = -1.0;
                // ref line 19
                for (int step = 0; step < sampleStepCount; step ++) {

                    // ref line 20
                    float stepScale = float(step + 1) / float(sampleStepCount);
                    // ref line 21
                    vec3 viewSpaceOffset = D * stepScale * sideCoef;
                    // ref line 22
                    vec3 marchingPosView = posView + viewSpaceOffset;
                    vec3 marchingPosUVDepth = viewPosToUvDepth(marchingPosView);
                    float marchingDepthSS = unpackRGBAToDepth(texture(g_depth, marchingPosUVDepth.xy));
                    vec3 marchingPosViewSS = uvDepthToViewPos(marchingPosUVDepth.xy, marchingDepthSS);

                    // ref line 23
                    vec3 horizonDir = marchingPosViewSS - posView;

                    horizonDir = normalize(horizonDir);
                    // ref line 24
                    cosHorizontal = max(cosHorizontal, dot(horizonDir, Wo));
                }

                // ref line 27: h[side] ← n+ CLAMP((−1+2 ∗ side) ∗ arccos(cHorizonCos)−n,−π/2,π/2)
                float sideTheta = projNormalTheta + clamp(sideCoef * acos(cosHorizontal) - projNormalTheta, -PI/2.0, PI/2.0);
                // ref line 28: visibility ← visibility+ LEN(projNormalV) ∗ (cosN+2 ∗ h[side] ∗ sin(n)−cos(2 ∗ h[side]−n))/4 
                visibility = visibility + length(projNormalInPlane) * (cosHorizontal + 2.0 * sideTheta * sin(projNormalTheta) - cos(2.0 * sideTheta - projNormalTheta)) / 4.0;
            }
        }

        visibility /= float(directionCount);
        
        fragColor = vec4(vec3(visibility), 1.0);
	}

`;

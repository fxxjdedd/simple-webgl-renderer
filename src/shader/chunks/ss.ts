export default /* glsl */ `

vec3 uvDepthToViewPos(vec2 uv, float depth) {
    vec3 ndc = vec3(uv, depth) * 2.0 - 1.0;
    vec4 posHomo = (inverse(projMatrix) * vec4(ndc, 1.0));
    return (posHomo/posHomo.w).xyz;
}

vec3 viewPosToNDC(vec3 viewPos) {
    vec4 posHomo = projMatrix * vec4(viewPos, 1.0);
    return posHomo.xyz / posHomo.w;
}

vec3 viewPosToUvDepth(vec3 viewPos) {
    vec3 ndc = viewPosToNDC(viewPos);
    vec2 uv = ndc.xy * 0.5 + 0.5;
    float depth = ndc.z * 0.5 + 0.5;
    return vec3(uv, depth);
}

`;

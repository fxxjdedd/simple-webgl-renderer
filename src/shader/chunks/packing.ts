// from three.js
export default /* glsl */ `
const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

const float ShiftRight8 = 1. / 256.;

vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8; // tidy overflow
	return r * PackUpscale;
}

float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}

vec3 unpackTangentNormalMap(sampler2D normalMap, vec2 uv, vec3 surfPosInEye, vec3 surfNormal) {
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
`;

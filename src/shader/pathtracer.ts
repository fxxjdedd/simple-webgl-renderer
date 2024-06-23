export const vertex = /* glsl */ `
#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;

#endif
`;

export const fragment = /* glsl */ `
#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;

#endif
`;

export const attributes: string[] = [];
export const uniforms: string[] = [];

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
	#define RECIPROCAL_PI 0.3183098861837907
	#define EPSILON 1e-6

	struct DirLight {
		vec3 direction;
		vec3 color;
		float intensity;
	};

	struct PBRMaterial {
		vec3 diffuseColor;
		vec3 specularColor;
		float roughness;
	};

	struct BRDFOutLight {
		vec3 diffuseColor;
		vec3 specularColor;
		vec3 indirectDiffuse;
		vec3 indirectSpecular;
	};

	vec3 BRDF_Fresnel(const in vec3 f0, const in vec3 f90, const in float dotVH) {

		// Optimized variant (presented by Epic at SIGGRAPH '13)
		// https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
		float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );

		return f0 * (1.0 - fresnel) + (f90 * fresnel);
	}

	// Microfacet Models for Refraction through Rough Surfaces - equation (33)
	// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
	// alpha is "roughness squared" in Disney’s reparameterization
	float BRDF_Distribution( const in float alpha, const in float dotNH ) {

		float a2 = pow(alpha, 2.0);
	
		float denom = pow(dotNH, 2.0) * (a2 - 1.0) + 1.0; // avoid alpha = 0 with dotNH = 1
	
		return RECIPROCAL_PI * a2 / pow(denom, 2.0);
	}

	// Moving Frostbite to Physically Based Rendering 3.0 - page 12, listing 2
	// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
	float BRDF_Geometry( const in float alpha, const in float dotLN, const in float dotNV ) {

		float a2 = pow(alpha, 2.0);

		float gv = dotLN * sqrt(a2 + (1.0 - a2) * pow(dotNV, 2.0));
		float gl = dotNV * sqrt(a2 + (1.0 - a2) * pow(dotLN, 2.0));

		return 0.5 / max( gv + gl, EPSILON );
	}


	vec3 BRDF_SpecularPart(vec3 pos, vec3 Wo, vec3 Wi, vec3 normal, PBRMaterial pbrMaterial) {
		// BRDF GGX
		vec3 F0 = pbrMaterial.specularColor;
		vec3 F90 = vec3(1.0);
		float alpha = pow(pbrMaterial.roughness, 2.0);

		vec3 H = normalize(Wo + Wi);
		float dotLN = clamp(dot(Wi, normal), 0.0, 1.0);
		float dotVN = clamp(dot(Wo, normal), 0.0, 1.0);
		float dotVH = clamp(dot(Wo, normal), 0.0, 1.0);
		float dotNH = clamp(dot(H, normal), 0.0, 1.0);

		vec3 F = BRDF_Fresnel(F0, F90, dotVH);
		float D = BRDF_Distribution(alpha, dotNH);
		float G = BRDF_Geometry(alpha, dotLN, dotVN);

		return F * (D * G);
		// return F0 * D;
	}

	vec3 BRDF_DiffusePart(vec3 diffuseColor) {
		// BRDF Lambert
		return RECIPROCAL_PI * diffuseColor;
	}


	uniform mat4 projMatrix;
	uniform mat4 mvMatrix;
	uniform vec4 viewport;

	uniform DirLight dirLight;
	// pbr parameters
	uniform float metalness;
	uniform float roughness;

	uniform sampler2D g_pos;
	uniform sampler2D g_diffuse;
	uniform sampler2D g_normal;
	uniform sampler2D g_depth;

	out vec4 fragColor;

	float ToLinearDepth(float depth) {
		float ndc = depth * 2.0 - 1.0; 
		// https://stackoverflow.com/questions/56428880/how-to-extract-camera-parameters-from-projection-matrix
		float near = projMatrix[3][2]/(projMatrix[2][2] - 1.0);
		float far = projMatrix[2][3]/(projMatrix[2][2] + 1.0);
		float linearDepth = (2.0 * near * far) / (far + near - ndc * (far - near));	
		return linearDepth;
	}

	void main() {
		highp vec2 uv = (gl_FragCoord.xy - viewport.xy)/viewport.zw;

		float depth = texture(g_depth, uv).r;
		depth = ToLinearDepth(depth);

		vec3 diffuse = texture(g_diffuse, uv).xyz;
		vec3 normal = texture(g_normal, uv).xyz * 2.0 - 1.0;
		vec3 pos = texture(g_pos, uv).xyz * 2.0 - 1.0;

		vec3 L = dirLight.direction;
		vec3 N = normal;
		vec3 V = inverse(mvMatrix)[3].xyz - pos;
		vec3 H = normalize(L + V);

		BRDFOutLight outLight;

		PBRMaterial pbrMaterial;
		// NOTE: diffuseColor is the diffuse reflected color, not albedo color
		pbrMaterial.diffuseColor = diffuse * (1.0 - metalness);
		pbrMaterial.specularColor = mix(vec3(0.04), diffuse, metalness);

		vec3 dxy = max(abs(dFdx(normal)), abs(dFdy(normal)));
		float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
		pbrMaterial.roughness = max( pbrMaterial.roughness, 0.0525 );// 0.0525 corresponds to the base mip of a 256 cubemap.
		pbrMaterial.roughness += geometryRoughness;
		pbrMaterial.roughness = min( pbrMaterial.roughness, 1.0 );

		vec3 Wi = dirLight.direction;
		vec3 Wo = inverse(mvMatrix)[3].xyz - pos;
		float dtLN = clamp(dot(normal, normalize(dirLight.direction)), 0.0, 1.0);
		vec3 Li = dtLN * dirLight.color; // radiance

		// direct lighting
		outLight.diffuseColor += Li * BRDF_DiffusePart(pbrMaterial.diffuseColor);
		outLight.specularColor += Li * BRDF_SpecularPart(pos, Wo, Wi, normal, pbrMaterial);

		// indirect lighting
		vec3 ambient = vec3(1.0,1.0,1.0);
		vec3 irradiance = ambient;

		outLight.indirectDiffuse = irradiance * BRDF_DiffusePart(pbrMaterial.diffuseColor);


		vec3 Lo_Diffuse = outLight.diffuseColor + outLight.indirectDiffuse;
		vec3 Lo_Specular = outLight.specularColor + outLight.indirectSpecular; 
		vec3 Lo = Lo_Diffuse + Lo_Specular;

		fragColor = vec4(Lo, 1.0);
	}
`;

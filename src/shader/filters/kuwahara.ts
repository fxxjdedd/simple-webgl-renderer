export function getDefines() {
    return {
        MAX_SIZE: 5,
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
    #define MAX_SIZE 5
    #define MAX_KERNEL_SIZE ((MAX_SIZE*2)*(MAX_SIZE*2))

    uniform int size;
    uniform sampler2D map;
    uniform vec4 viewport;

    const vec3 valueRatios = vec3(0.3, 0.59, 0.11);
    float values[MAX_KERNEL_SIZE];
    float valueMean = 0.0;
    float variance = 0.0;
    float minVariance = -1.0;
    vec4 colorMeanTemp = vec4(0.);
    vec4 colorMean = vec4(0.); 
    int count = 0;

    int i = 0;
    int j = 0;
    void findMean(int i0, int i1, int j0, int j1) {
        colorMeanTemp = vec4(0.);
        count = 0;
        for (i = i0; i < i1; i++) {
            for (j = j0; j < j1; j++) {
                vec2 uv = (gl_FragCoord.xy - viewport.xy + vec2(i, j)) / viewport.zw;
                vec4 color = texture(map, uv);
                colorMeanTemp += color;
                values[count] = dot(color.rgb, valueRatios);
                count += 1;
            }
        }

        colorMeanTemp.rgb /= float(count);
        valueMean = dot(colorMeanTemp.rgb, valueRatios);

        for (i = 0; i < count; i++) {
            variance += pow(values[i] - valueMean, 2.0);
        }

        variance /= float(count);

        if (variance < minVariance || minVariance <= -1.0) {
            colorMean = colorMeanTemp;
            minVariance = variance;
        }

    }
    out vec4 fragColor;

	void main() {
        findMean(-size, 0, -size, 0);
        findMean(0, size, 0, size);
        findMean(0, size, -size, 0);
        findMean(-size, 0, 0, size);

        fragColor = colorMean;
	}

`;

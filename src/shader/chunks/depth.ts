export default /* glsl */ `

float zToOrthoDepth(float z, float near, float far) {
    return (-z - near) / (far - near);
}

float zToPerspDepth(float z, float near, float far) {
    return ((-z - near) * far) / (far - near) / -z; // w-divide
}

float orthoDepthToZ(float depth, float near, float far) {
    return -(near + (far - near) * depth);
}

float perspDepthToZ(float depth, float near, float far) {
    return near*far / ((far - near) * depth - far);
}

// equal to perpsective depth to ortho depth
float toLinearDepth(float depth) {
#ifdef PERSPECTIVE_CAMERA
    // https://stackoverflow.com/questions/56428880/how-to-extract-camera-parameters-from-projection-matrix
    float near = projMatrix[3][2]/(projMatrix[2][2] - 1.0);
    float far = projMatrix[2][3]/(projMatrix[2][2] + 1.0);
    float perspZ = perspDepthToZ(depth, near, far);
    return zToOrthoDepth(perspZ, near, far);
#elif defined(ORTHOGRAPHIC_CAMERA)
    return depth;
#else
    return depth;
#endif
}
`;

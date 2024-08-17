export function getAdaptiveAspectRatio(width, height) {
    if (width > height) {
        return height / width;
    } else {
        return width / height;
    }
}

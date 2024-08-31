export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

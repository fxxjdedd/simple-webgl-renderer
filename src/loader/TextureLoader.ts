import { Texture } from "../core/texture";

export class TextureLoader {
    public load(url: string) {
        const texture = new Texture();
        const img = new Image();
        img.onload = () => {
            texture.image = img;
            texture.isDirty = true;
        };
        img.src = url;
        return texture;
    }
}

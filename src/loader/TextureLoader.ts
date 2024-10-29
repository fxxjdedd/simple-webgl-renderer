import { Texture } from "../core/texture";
import { Loader } from "./Loader";

export class TextureLoader extends Loader<Texture> {
    public load(url: string) {
        const texture = new Texture();
        texture.url = url;
        const img = new Image();
        img.onload = () => {
            texture.image = img;
            texture.isDirty = true;
            this.emit("loader:load", texture);
        };
        img.src = url;
        return texture;
    }
}

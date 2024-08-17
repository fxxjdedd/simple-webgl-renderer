import { EventBase } from "../util/eventbase";

export class Loader<T> extends EventBase {
    onLoad(cb: (result: T) => void) {
        return this.on("loader:load", cb);
    }
}

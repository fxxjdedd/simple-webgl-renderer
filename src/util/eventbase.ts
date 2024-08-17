import { createNanoEvents, Emitter } from "nanoevents";

export class EventBase {
    protected emitter: Emitter;
    constructor() {
        this.emitter = createNanoEvents();
    }

    protected on(event: string, listener: (...args: any[]) => void) {
        return this.emitter.on(event, listener);
    }

    protected once(event: string, listener: (...args: any[]) => void) {
        const unbind = this.emitter.on(event, (...args) => {
            unbind();
            listener(...args);
        });
        return unbind;
    }
    protected emit(event: string, ...args: any[]) {
        this.emitter.emit(event, ...args);
    }
}

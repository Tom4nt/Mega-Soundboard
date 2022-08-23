export interface ExposedEvent<Args> {
    addHandler(handler: (args: Args) => void): void;
    removeHandler(handler: (args: Args) => void): void;
}

export class Event<Args> implements ExposedEvent<Args> {
    private hanlders: ((args: Args) => void)[] = [];

    addHandler(handler: (args: Args) => void): void {
        this.hanlders.push(handler);
    }

    removeHandler(handler: (args: Args) => void): void {
        this.hanlders = this.hanlders.filter(h => h !== handler);
    }

    raise(args: Args): void {
        this.hanlders.slice().forEach(h => h(args));
    }

    expose(): ExposedEvent<Args> {
        return this;
    }
}
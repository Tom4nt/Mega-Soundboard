export interface ExposedEvent<Args> {
    addHandler: (handler: (args: Args) => unknown) => void;
    removeHandler: (handler: (args: Args) => unknown) => void;
}

export class Event<Args> implements ExposedEvent<Args> {
    private hanlders: ((args: Args) => unknown)[] = [];

    addHandler = (handler: (args: Args) => unknown): void => {
        this.hanlders.push(handler);
    };

    removeHandler = (handler: (args: Args) => unknown): void => {
        this.hanlders = this.hanlders.filter(h => h !== handler);
    };

    raise = (args: Args): void => {
        this.hanlders.slice().forEach(h => h(args));
    };

    expose = (): ExposedEvent<Args> => {
        return this;
    };
}
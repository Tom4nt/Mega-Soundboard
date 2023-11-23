import { Events, eventsKeys, EventsMap } from "../../shared/ipcEvents";
import { ExposedEvent, Event } from "../../shared/events";

export default class GlobalEvents {
    private static events = new Map<keyof Events, ExposedEvent<unknown>>();
    private static didRegisterEvents: boolean;

    static {
        this.registerEvents();
    }

    static addHandler<T extends keyof Events>(name: T, handler: (args: EventsMap[T]) => unknown): void {
        const h = handler as (param: unknown) => unknown;
        this.getEvent(name).addHandler(h);
    }

    static removeHandler<T extends keyof Events>(name: T, handler: (args: EventsMap[T]) => unknown): void {
        const h = handler as (param: unknown) => unknown;
        this.getEvent(name).removeHandler(h);
    }

    private static registerEvents(): void {
        // TODO: Inject event object into window to allow accessing events by property name instead of by addHandler(T).
        if (this.didRegisterEvents) throw Error("Events have already been registered.");
        const bridgeObject: Record<string, unknown> = {};
        for (const k of eventsKeys) {
            const event = new Event<EventsMap[typeof k]>();
            bridgeObject[k] = event.expose();
            window.addListener(k, (param) => {
                event.raise(param as EventsMap[typeof k]);
            });
            this.events.set(k, event);
        }
        this.didRegisterEvents = true;
    }

    private static getEvent<T extends keyof Events>(name: T): Events[T] {
        return this.events.get(name) as Events[T];
    }
}

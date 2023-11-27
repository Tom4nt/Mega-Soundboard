import { Events, eventsKeys, EventsMap } from "../../shared/ipcEvents";
import { ExposedEvent, Event } from "../../shared/events";

export default class GlobalEvents {
    private static events = new Map<keyof Events, ExposedEvent<unknown>>();
    private static eventsList = {} as Events;
    private static didRegisterEvents: boolean;

    static registerEvents(): void {
        if (this.didRegisterEvents) throw Error("Events have already been registered.");
        for (const k of eventsKeys) {
            const event = new Event<EventsMap[typeof k]>();
            window.addListener(k, (param) => {
                event.raise(param as EventsMap[typeof k]);
            });
            this.events.set(k, event);
            this.eventsList[k] = event.expose() as ExposedEvent<never>;
        }
        window.events = this.eventsList;
        this.didRegisterEvents = true;
    }
}

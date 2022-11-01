import { contextBridge, ipcRenderer } from "electron";
import { Event } from "./events";
import { eventsKeys, EventsMap } from "./ipcEvents";
import { actionsKeys, Actions } from "./ipcActions";

function registerEvents(): void {
    const bridgeObject: Record<string, unknown> = {};
    for (const k of eventsKeys) {
        const event = new Event<EventsMap[typeof k]>();
        bridgeObject[k] = event.expose();
        ipcRenderer.on(k, (_e, param) => {
            return event.raise(param as EventsMap[typeof k]);
        });
    }
    contextBridge.exposeInMainWorld("events", bridgeObject);
}

function registerActions(): void {
    const bridgeObject: Record<string, unknown> = {};
    for (const k of actionsKeys) {
        const f: Actions[typeof k] = async (...params: unknown[]) => {
            return await ipcRenderer.invoke(k, params) as unknown;
        };
        bridgeObject[k] = f;
    }
    contextBridge.exposeInMainWorld("actions", bridgeObject);
}

registerEvents();
registerActions();

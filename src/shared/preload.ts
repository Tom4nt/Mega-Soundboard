import { contextBridge, ipcRenderer } from "electron";
import { Events, EventsMap, eventsKeys } from "./ipcEvents";
import { actionsKeys, Actions } from "./ipcActions";
import InitialContent from "./models/initialContent";
import { Event } from "./events";

// function registerEvents(): void {
//     const bridgeObject: Record<string, unknown> = {};
//     for (const k of eventsKeys) {
//         const event = new Event<EventsMap[typeof k]>();
//         bridgeObject[k] = event.expose();
//         ipcRenderer.on(k, (_e, param) => {
//             return event.raise(param as EventsMap[typeof k]);
//         });
//     }
//     contextBridge.exposeInMainWorld("events", bridgeObject);
// }

function registerGetInitialContent(): void {
    const content = ipcRenderer.sendSync("load") as InitialContent;
    contextBridge.exposeInMainWorld("getInitialContent", () => content);
}

function registerEvents(): void {
    const bridgeObject = <T extends keyof Events>(name: T, f: (param: unknown) => void): void => {
        ipcRenderer.on(name, (_e, param) => {
            f(param as EventsMap[typeof name]);
        });
    };
    contextBridge.exposeInMainWorld("addListener", bridgeObject);
}

function registerEvents2(): void {
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

registerGetInitialContent();
registerEvents();
registerActions();
registerEvents2();

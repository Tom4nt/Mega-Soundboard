import { contextBridge, ipcRenderer } from "electron";
import { Events, EventsMap } from "./ipcEvents";
import { actionsKeys, Actions } from "./ipcActions";
import InitialContent from "./models/initialContent";

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

const content = ipcRenderer.sendSync("load") as InitialContent;
contextBridge.exposeInMainWorld("getInitialContent", () => content);

contextBridge.exposeInMainWorld("addListener",
    <T extends keyof Events>(name: T, f: (param: unknown) => void) => {
        ipcRenderer.on(name, (_e, param) => {
            f(param as EventsMap[typeof name]);
        });
    });

// registerEvents();
registerActions();

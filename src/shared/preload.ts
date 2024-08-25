import { contextBridge, ipcRenderer } from "electron";
import { Events, EventsMap } from "./ipcEvents";
import { actionsKeys, Actions } from "./ipcActions";
import { IInitialContent } from "./models/dataInterfaces";

function registerGetInitialContent(): void {
	const content = ipcRenderer.sendSync("load") as IInitialContent;
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

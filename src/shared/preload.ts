import { contextBridge, ipcRenderer } from "electron";
import { Event } from "./events";
import { fromMain, fromRender } from "./ipcChannels";
import { Sound } from "./models";

const onKeybindsStateChanged = new Event<boolean>();
const onSoundAdded = new Event<Sound>();
const onSoundRemoved = new Event<Sound>();

ipcRenderer.on(fromMain.soundFileAdded, (_e, sound: Sound) => {
    onSoundAdded.raise(sound);
});

ipcRenderer.on(fromMain.soundFileRemoved, (_e, sound: Sound) => {
    onSoundRemoved.raise(sound);
});

ipcRenderer.on(fromMain.keybindsStateChanged, (_e, state: boolean) => {
    onKeybindsStateChanged.raise(state);
});

// ---

contextBridge.exposeInMainWorld("events", {
    onSoundAdded: onSoundAdded.expose(),
    onSoundRemoved: onSoundRemoved.expose(),
    onKeybindsStateChanged: onKeybindsStateChanged.expose(),
});

contextBridge.exposeInMainWorld("actions", {
    toggleKeybinsState() {
        ipcRenderer.send(fromRender.toggleKeybindsState);
    }
});

contextBridge.exposeInMainWorld("functions", {
    browseFile(multiple: boolean, displayedName: string, extensions: string[]) {
        return ipcRenderer.invoke(fromRender.browseFile, multiple, displayedName, extensions) as Promise<string[]>;
    },

    browseFolder() {
        return ipcRenderer.invoke(fromRender.browseFolder) as Promise<string>;
    }
});
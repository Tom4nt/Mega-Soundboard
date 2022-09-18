import { contextBridge, ipcRenderer } from "electron";
import { Event } from "./events";
import channels from "./ipcChannels";
import { Sound } from "./models";

const onKeybindsStateChanged = new Event<boolean>();
const onSoundAdded = new Event<Sound>();

ipcRenderer.on(channels.soundFileAdded, (_e, sound: Sound) => {
    onSoundAdded.raise(sound);
});

contextBridge.exposeInMainWorld("events", {
    onSoundAdded: onSoundAdded.expose(),
    onKeybindsStateChanged: onKeybindsStateChanged.expose()
});
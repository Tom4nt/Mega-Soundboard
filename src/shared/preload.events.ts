import { contextBridge, ipcRenderer } from "electron";
import { Event, ExposedEvent } from "./events";
import { IDevice, SoundAddedArgs, SoundChangedArgs, WindowState } from "./interfaces";
import { Sound, Soundboard } from "./models";

// export interface MainEvent {
//     name: string;
// }

export class MainEvent<T> {
    constructor(
        public name: string,
        public raiseEvent: (param: unknown) => void,
        public exposeEvent: () => ExposedEvent<T>,
    ) { }

    static create<T>(name: string): MainEvent<T> {
        const event = new Event<T>();
        const instance = new MainEvent(name,
            (p) => event.raise(p as T),
            () => event.expose());
        return instance;
    }
}

// TODO: Move to shared reference that the main process will reference.
export const mainEvents = {
    keybindsStateChanged: MainEvent.create<boolean>("onKeybindsStateChanged"),
    overlapSoundsStateChanged: MainEvent.create<boolean>("onOverlapSoundsStateChanged"),
    devicesChanged: MainEvent.create<IDevice[]>("onDevicesChanged"),
    soundAdded: MainEvent.create<SoundAddedArgs>("onSoundAdded"),
    soundChanged: MainEvent.create<SoundChangedArgs>("onSoundChanged"),
    soundRemoved: MainEvent.create<Sound>("onSoundRemoved"),
    soundboardAdded: MainEvent.create<Soundboard>("onSoundboardAdded"),
    soundboardRemoved: MainEvent.create<Soundboard>("onSoundboardRemoved"),
    windowStateChanged: MainEvent.create<WindowState>("onWindowStateChanged"),
    keyRecordingProgress: MainEvent.create<number[]>("onKeyRecordingProgress"),
    currentSoundboardChanged: MainEvent.create<Soundboard>("onCurrentSoundboardChanged"),
    minToTrayChanged: MainEvent.create<boolean>("onMinToTrayChanged"),
    updateAvailable: MainEvent.create<void>("onUpdateAvailable"),
    updateProgress: MainEvent.create<number>("onUpdateProgress"),
    updateReady: MainEvent.create<void>("onUpdateReady"),
} as const;

const bridgeObject: Record<string, unknown> = {};
let prop: keyof typeof mainEvents;
for (prop in mainEvents) {
    const event = mainEvents[prop];
    bridgeObject[event.name] = event.exposeEvent();
    ipcRenderer.on(event.name, (_e, param) => event.raiseEvent(param));
}
contextBridge.exposeInMainWorld("events", bridgeObject);

// const onKeybindsStateChanged = new Event<boolean>();
// const onOverlapSoundsStateChanged = new Event<boolean>();
// const onDevicesChanged = new Event<IDevice[]>;
// const onSoundAdded = new Event<SoundAddedArgs>();
// const onSoundChanged = new Event<SoundChangedArgs>;
// const onSoundRemoved = new Event<Sound>();
// const onSoundboardAdded = new Event<Soundboard>();
// const onSoundboardRemoved = new Event<Soundboard>();
// const onWindowStateChanged = new Event<WindowState>();
// const onKeyRecordingProgress = new Event<number[]>();
// const onCurrentSoundboardChanged = new Event<Soundboard>();
// const onMinToTrayChanged = new Event<boolean>();
// const onUpdateAvailable = new Event<void>();
// const onUpdateProgress = new Event<number>();
// const onUpdateReady = new Event<void>();

// ---

// contextBridge.exposeInMainWorld("events", {
//     onKeybindsStateChanged: onKeybindsStateChanged.expose(),
//     onOverlapSoundsStateChanged: onOverlapSoundsStateChanged.expose(),
//     onDevicesChanged: onDevicesChanged.expose(),
//     onSoundAdded: onSoundAdded.expose(),
//     onSoundChanged: onSoundChanged.expose(),
//     onSoundRemoved: onSoundRemoved.expose(),
//     onSoundboardAdded: onSoundboardAdded.expose(),
//     onSoundboardRemoved: onSoundboardRemoved.expose(),
//     onWindowStateChanged: onWindowStateChanged.expose(),
//     onKeyRecordingProgress: onKeyRecordingProgress.expose(),
//     onCurrentSoundboardChanged: onCurrentSoundboardChanged.expose(),
//     onMinToTrayChanged: onMinToTrayChanged.expose(),
//     onUpdateAvailable: onUpdateAvailable.expose(),
//     onUpdateProgress: onUpdateProgress.expose(),
//     onUpdateReady: onUpdateReady.expose(),
// });

// // ---

// ipcRenderer.on(getFromMain("keybindsStateChanged"), (_e, state: boolean) => {
//     onKeybindsStateChanged.raise(state);
// });

// ipcRenderer.on(getFromMain("overlapSoundsChanged"), (_e, state: boolean) => {
//     onOverlapSoundsStateChanged.raise(state);
// });

// ipcRenderer.on(getFromMain("devicesChanged"), (_e, devices: IDevice[]) => {
//     onDevicesChanged.raise(devices);
// });

// ipcRenderer.on(getFromMain("soundAdded"), (_e, args: SoundAddedArgs) => {
//     onSoundAdded.raise(args);
// });

// ipcRenderer.on(getFromMain("soundChanged"), (_e, args: SoundChangedArgs) => {
//     onSoundChanged.raise(args);
// });

// ipcRenderer.on(getFromMain("soundRemoved"), (_e, sound: Sound) => {
//     onSoundRemoved.raise(sound);
// });

// ipcRenderer.on(getFromMain("soundboardAdded"), (_e, soundboard: Soundboard) => {
//     onSoundboardAdded.raise(soundboard);
// });

// ipcRenderer.on(getFromMain("soundboardRemoved"), (_e, soundboard: Soundboard) => {
//     onSoundboardRemoved.raise(soundboard);
// });

// ipcRenderer.on(getFromMain("windowStateChanged"), (_e, state: WindowState) => {
//     onWindowStateChanged.raise(state);
// });

// ipcRenderer.on(getFromMain("keyRecordingProgress"), (_e, keys: number[]) => {
//     onKeyRecordingProgress.raise(keys);
// });

// ipcRenderer.on(getFromMain("currentSoundboardChanged"), (_e, soundboard: Soundboard) => {
//     onCurrentSoundboardChanged.raise(soundboard);
// });

// ipcRenderer.on(getFromMain("minToTrayChanged"), (_e, state: boolean) => {
//     onMinToTrayChanged.raise(state);
// });

// ipcRenderer.on(getFromMain("updateAvailable"), () => {
//     onUpdateAvailable.raise();
// });

// ipcRenderer.on(getFromMain("updateProgress"), (_e, progress: number) => {
//     onUpdateProgress.raise(progress);
// });

// ipcRenderer.on(getFromMain("updateReady"), () => {
//     onUpdateReady.raise();
// });

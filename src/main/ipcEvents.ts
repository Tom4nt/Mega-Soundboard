import { IDevice, SoundAddedArgs, SoundChangedArgs, WindowState } from "../shared/interfaces";
import { Sound, Soundboard } from "../shared/models";
import { MainEvent, mainEvents } from "../shared/preload.events"; // TODO: Remove reference. Replace with shared reference with all the events.
import MS from "./ms";

export const events = mainEvents;

export default class IPCEvents {
    // private static send(message: MainEvent, ...args: unknown[]): void {
    //     MS.instance.windowManager.window.webContents.send(message, args);
    // }

    static send<T extends object | number | boolean>(event: MainEvent<T>, arg: T): void {
        MS.instance.windowManager.window.webContents.send(event.name, arg);
    }

    static sendVoid<T extends void>(event: MainEvent<T>): void {
        MS.instance.windowManager.window.webContents.send(event.name);
    }

    // static sendKebindsStateChanged(state: boolean): void {
    //     this.send("keybindsStateChanged", state);
    // }

    // static sendOverlapSoundsChanged(state: boolean): void {
    //     this.send("overlapSoundsStateChanged", state);
    // }

    // static sendDevicesChanged(devices: IDevice[]): void {
    //     this.send("devicesChanged", devices);
    // }

    // static sendSoundAdded(args: SoundAddedArgs): void {
    //     this.send("soundAdded", args);
    // }

    // static sendSoundChanged(args: SoundChangedArgs): void {
    //     this.send("soundChanged", args);
    // }

    // static sendSoundRemoved(sound: Sound): void {
    //     this.send("soundRemoved", sound);
    // }

    // static sendSoundboardAdded(soundboard: Soundboard): void {
    //     this.send("soundboardAdded", soundboard);
    // }

    // static sendWindowStateChanged(state: WindowState): void {
    //     this.send("windowStateChanged", state);
    // }

    // static sendKeyRecordingProgress(key: number[]): void {
    //     this.send("keyRecordingProgress", key);
    // }

    // static sendCurrentSoundboardChanged(current: Soundboard): void {
    //     this.send("currentSoundboardChanged", current);
    // }

    // static sendMinToTrayChanged(state: boolean): void {
    //     this.send("minToTrayChanged", state);
    // }

    // static sendUpdateAvailable(): void {
    //     this.send("updateAvailable");
    // }

    // static sendUpdateProgress(progress: number): void {
    //     this.send("updateProgress", progress);
    // }

    // static sendUpdateReady(): void {
    //     this.send("updateReady");
    // }
}
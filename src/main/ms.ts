import { Event, ExposedEvent } from "../shared/events";
import { Settings, Sound } from "../shared/models";

/** Represents the app instance in the main process. */
export default class MS {
    isRecordingKey = false;
    modalsOpen = 0;

    get onToggleKeybindsState(): ExposedEvent<void> { return this._onToggleKeybindsState.expose(); }
    get onPlaySound(): ExposedEvent<Sound> { return this._onPlaySound.expose(); }
    get onStopSound(): ExposedEvent<Sound> { return this._onStopSound.expose(); }
    get onStopAllSounds(): ExposedEvent<void> { return this._onStopAllSounds.expose(); }

    private readonly _onToggleKeybindsState = new Event<void>();
    private readonly _onPlaySound = new Event<Sound>();
    private readonly _onStopSound = new Event<Sound>();
    private readonly _onStopAllSounds = new Event<void>();

    static readonly latestWithLog = 2; // Increments on every version that should display the changelog.

    private static _instance: MS | null = null;
    public static get instance(): MS {
        if (!MS._instance) throw Error("MS Singleton was not initialized");
        return MS._instance;
    }
    private static set instance(value: MS) {
        MS._instance = value;
    }

    readonly playingSounds: Sound[] = [];
    readonly eventDispatcher = new EventTarget();

    private constructor(
        public readonly settings: Settings,
        public readonly devices: MediaDeviceInfo[]
    ) { }

    static async init(): Promise<void> {
        const result = await Promise.all([Settings.load(), this.getMediaDevices()]);
        MS.instance = new MS(result[0], result[1]);
    }

    handleSoundEnd(sound: Sound): void {
        this.removeSoundFromInstancesList(sound);
        this._onStopSound.raise(sound);
    }

    toggleKeybindsState(): void {
        const isEnabled = !this.settings.enableKeybinds;
        this.settings.enableKeybinds = isEnabled;
        // ipcRenderer.send("settings.enableKeybinds", isEnabled);
        this._onToggleKeybindsState.raise();

        // TODO: Listen on the preloader
    }

    static async getMediaDevices(): Promise<MediaDeviceInfo[]> {
        let devices = await navigator.mediaDevices.enumerateDevices();
        devices = devices.filter(device =>
            device.kind == "audiooutput" &&
            device.deviceId != "communications"
        );
        return devices;
    }

    // TODO
    setMinToTray(value: boolean): void {
        this.settings.minToTray = value;
        // ipcRenderer.send("win.minToTray", value);
    }

    // TODO
    static getVersion(): void {
        // return ipcRenderer.invoke("version") as Promise<string>;
    }

    removeSoundFromInstancesList(sound: Sound): void {
        this.playingSounds.splice(this.playingSounds.indexOf(sound), 1);
    }
}
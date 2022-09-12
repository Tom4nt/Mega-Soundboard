import { ipcRenderer } from "electron"; // Remove reference
import { Event, ExposedEvent } from "../shared/events";
import { Data, Settings, Side, Sound, Soundboard, UISoundPath } from "../shared/models";

/** MEGA SOUNDBOARD SINGLETON */
// TODO: Settings and Data should be in the main process.
export default class MS {
    recordingKey = false;
    modalsOpen = 0;
    mediaElement = new Audio();

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
        public readonly data: Data,
        public readonly settings: Settings,
        public readonly devices: MediaDeviceInfo[]
    ) { }

    static async init(): Promise<void> {
        const result = await Promise.all([Data.load(), Settings.load(), this.getMediaDevices()]);
        MS.instance = new MS(result[0], result[1], result[2]);
    }

    async playUISound(sound: UISoundPath): Promise<void> {
        this.mediaElement.src = sound;
        this.mediaElement.load();
        await this.mediaElement.play();
    }

    /** Plays a sound on the selected output devices. */
    async playSound(sound: Sound): Promise<void> {
        if (!this.settings.overlapSounds) this.stopAllSounds();
        const s = this.settings;
        await sound.play(s => this.handleSoundEnd(s), s.mainDeviceVolume, s.secondaryDeviceVolume, s.mainDevice, s.secondaryDevice);

        if (!this.playingSounds.includes(sound)) {
            this.playingSounds.push(sound);
            this._onPlaySound.raise(sound);
        }
    }

    handleSoundEnd(sound: Sound): void {
        this.removeSoundFromInstancesList(sound);
        this._onStopSound.raise(sound);
    }

    stopSound(sound: Sound): void {
        if (sound.isPlaying()) {
            this.removeSoundFromInstancesList(sound);
            sound.stop();
            this._onStopSound.raise(sound);
        }
    }

    stopSounds(soundboard: Soundboard): void {
        this.playingSounds.forEach(sound => {
            if (soundboard.sounds.includes(sound)) {
                this.stopSound(sound);
            }
        });
    }

    stopAllSounds(): void {
        for (let i = 0; i < this.playingSounds.length; i++) {
            this.playingSounds[i].stop();
            this.playingSounds.splice(i, 1);
            i--;
        }
        this._onStopAllSounds.raise();
    }

    getSelectedSoundboard(): Soundboard {
        return this.data.soundboards[this.settings.selectedSoundboard];
    }

    setSelectedSoundboard(soundboard: Soundboard): void {
        for (let i = 0; i < this.data.soundboards.length; i++) {
            const sb = this.data.soundboards[i];
            if (sb === soundboard) {
                this.settings.selectedSoundboard = i;
            }
        }
    }

    toggleKeybindsState(): void {
        const isEnabled = !this.settings.enableKeybinds;
        this.settings.enableKeybinds = isEnabled;
        ipcRenderer.send("settings.enableKeybinds", isEnabled);
        this._onToggleKeybindsState.raise();

        if (isEnabled) {
            void this.playUISound(UISoundPath.ON);
        } else {
            void this.playUISound(UISoundPath.OFF);
        }
    }

    static async getMediaDevices(): Promise<MediaDeviceInfo[]> {
        let devices = await navigator.mediaDevices.enumerateDevices();
        devices = devices.filter(device =>
            device.kind == "audiooutput" &&
            device.deviceId != "communications"
        );
        return devices;
    }

    setMinToTray(value: boolean): void {
        this.settings.minToTray = value;
        ipcRenderer.send("win.minToTray", value);
    }

    static async getVersion(): Promise<string> {
        return ipcRenderer.invoke("version") as Promise<string>;
    }

    removeSoundFromInstancesList(sound: Sound): void {
        this.playingSounds.splice(this.playingSounds.indexOf(sound), 1);
    }

    // TODO: Create a TooltipManager to hold Tooltip related logic.
    static openPopup(text: string, rect: DOMRect, position?: Side): HTMLDivElement {
        if (!position) position = "top";
        const middleX = rect.x + rect.width / 2;

        const div = document.getElementById("popup-layer");
        if (!div) throw "Element with id 'popup-layer' could not be found";

        const popup = document.createElement("div");
        popup.innerHTML = text;
        popup.classList.add("popup");
        popup.classList.add(position);

        popup.style.opacity = "0";
        popup.style.transform = "scale(0.8)";

        div.appendChild(popup);

        if (position != "left" && position != "right") {
            const left = middleX - (popup.offsetWidth / 2);
            popup.style.left = left.toString() + "px";
        }
        else {
            if (position == "left") {
                const left = rect.x - popup.offsetWidth - 12;
                popup.style.left = left.toString() + "px";
            } else {
                const left = rect.x + rect.width + 12;
                popup.style.left = left.toString() + "px";
            }
        }

        if (position == "bottom") {
            const top = rect.y + rect.height + 12;
            popup.style.top = top.toString() + "px";
        } else if (position == "top") {
            const top = rect.y - popup.offsetHeight - 12;
            popup.style.top = top.toString() + "px";
        } else {
            const top = rect.y + (rect.height - popup.offsetHeight) / 2;
            popup.style.top = top.toString() + "px";
        }

        popup.style.opacity = "";
        popup.style.transform = "";

        return popup;
    }

    static addPopup(text: string, element: HTMLElement, position?: Side): void {
        let popup: HTMLDivElement | null = null;

        element.addEventListener("mouseenter", () => {
            const rect = element.getBoundingClientRect();
            popup = MS.openPopup(text, rect, position);
        });

        element.addEventListener("mouseleave", () => {
            if (popup) MS.closePopup(popup);
        });
    }

    static closePopup(popupElement: HTMLDivElement): void {
        popupElement.style.opacity = "0";
        popupElement.style.transform = "scale(0.8)";
        popupElement.ontransitionend = (): void => {
            popupElement.remove();
        };
    }
}
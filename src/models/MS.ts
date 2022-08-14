import { ipcRenderer } from "electron";
import Data from "./Data";
import Settings from "./Settings";
import Sound from "./Sound";
import Soundboard from "./Soundboard";

enum MSEvent {
    EVENT_TOGGLED_KEYBINDS_STATE = "toggled-keybinds-state",
    EVENT_SOUND_PLAY = "sound-play",
    EVENT_SOUND_STOP = "sound-stop",
    EVENT_STOP_ALL_SOUNDS = "sound-stopall"
}

enum UISoundPath {
    ON = "res/audio/on.wav",
    OFF = "res/audio/off.wav",
    ERROR = "res/audio/error.wav"
}

type PopupPosition = "top" | "bottom" | "left" | "right"

/** MEGA SOUNDBOARD SINGLETON */
export default class MS {

    static readonly latestWithLog = 2; // Increments on every version that should display the changelog.

    private static _instance: MS | null = null;
    public static get instance(): MS {
        if (!MS._instance) throw "MS Singleton was not initialized";
        return MS._instance;
    }
    private static set instance(value: MS) {
        MS._instance = value;
    }

    readonly playingSounds: Sound[] = [];
    readonly eventDispatcher = new EventTarget();

    recordingKey = false;
    modalsOpen = 0;
    uiSound: HTMLMediaElement | null = null;

    constructor(
        public readonly data: Data,
        public readonly settings: Settings,
        public readonly devices: MediaDeviceInfo[]
    ) { }

    async init(): Promise<void> {
        const result = await Promise.all([Data.load(), Settings.load(), this.getMediaDevices()]);
        MS.instance = new MS(result[0], result[1], result[2]);
    }

    async playUISound(sound: UISoundPath): Promise<void> {
        if (this.uiSound) {
            this.uiSound.src = "";
            this.uiSound.load();
        }
        const s = new Audio(sound);
        this.uiSound = s;
        await s.play();
    }

    /** Plays a sound on the selected output devices. */
    async playSound(sound: Sound): Promise<void> {
        if (sound) {
            if (!this.settings.overlapSounds) this.stopAllSounds();
            const s = this.settings;
            await sound.play(s => this.handleSoundEnd(s), s.mainDeviceVolume, s.secondaryDeviceVolume, s.mainDevice, s.secondaryDevice);

            if (!this.playingSounds.includes(sound)) {
                this.playingSounds.push(sound);
                this.eventDispatcher.dispatchEvent(new CustomEvent(MSEvent.EVENT_SOUND_PLAY, { detail: sound }));
            }
        }
    }

    handleSoundEnd(sound: Sound): void {
        this.removeSoundFromInstancesList(sound);
        this.eventDispatcher.dispatchEvent(new CustomEvent(MSEvent.EVENT_SOUND_STOP, { detail: sound }));
    }

    stopSound(sound: Sound): void {
        if (sound && sound.isPlaying()) {
            this.removeSoundFromInstancesList(sound);
            sound.stop();
            this.eventDispatcher.dispatchEvent(new CustomEvent(MSEvent.EVENT_SOUND_STOP, { detail: sound }));
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
        this.eventDispatcher.dispatchEvent(new CustomEvent(MSEvent.EVENT_STOP_ALL_SOUNDS));
    }

    getSelectedSoundboard(): Soundboard | null {
        if (!this.data) return null;
        return this.data.soundboards[this.settings.selectedSoundboard];
    }

    setSelectedSoundboard(soundboard: Soundboard): void {
        if (!this.data) return;
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
        this.eventDispatcher.dispatchEvent(new CustomEvent(MSEvent.EVENT_TOGGLED_KEYBINDS_STATE));

        if (isEnabled) {
            void this.playUISound(UISoundPath.ON);
        } else {
            void this.playUISound(UISoundPath.OFF);
        }
    }

    async getMediaDevices(): Promise<MediaDeviceInfo[]> {
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

    async getVersion(): Promise<string> {
        return ipcRenderer.invoke("version") as Promise<string>;
    }

    removeSoundFromInstancesList(sound: Sound): void {
        this.playingSounds.splice(this.playingSounds.indexOf(sound), 1);
    }

    openPopup(text: string, rect: DOMRect, position?: PopupPosition): HTMLDivElement {
        if (!position) position = "top";
        const middleX = rect.x + rect.width / 2;

        const div = document.getElementById("popup-layer");
        if (!div) throw "Element with id 'popup-layer' could not be found";

        const popup = document.createElement("div");
        popup.innerHTML = text;
        popup.classList.add("popup");
        if (position) popup.classList.add(position);

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

    addPopup(text: string, element: HTMLElement, position?: PopupPosition): void {
        let popup: HTMLDivElement | null = null;

        element.addEventListener("mouseenter", () => {
            const rect = element.getBoundingClientRect();
            popup = this.openPopup(text, rect, position);
        });

        element.addEventListener("mouseleave", () => {
            if (popup) this.closePopup(popup);
        });
    }

    private closePopup(popupElement: HTMLDivElement): void {
        if (popupElement) {
            popupElement.style.opacity = "0";
            popupElement.style.transform = "scale(0.8)";
            popupElement.ontransitionend = (): void => {
                popupElement.remove();
            };
        }
    }
}
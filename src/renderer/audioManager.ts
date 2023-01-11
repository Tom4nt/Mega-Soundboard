import { Event, ExposedEvent } from "../shared/events";
import { Settings, Sound } from "src/shared/models";
import { AudioInstance, UISoundPath } from "./models";
import { IDevice } from "../shared/interfaces";
import GlobalEvents from "./util/globalEvents";
import Keys from "../shared/keys";

const MSG_ERR_NOT_CONNECTED = "This sound cannot be played because it is not connected to a Soundboard.";

export default class AudioManager {
    overlapSounds = false;

    private mainDevice: string;
    private mainDeviceVolume: number;
    private secondaryDevice: string | null;
    private secondaryDeviceVolume: number;
    private stopSoundsKeys: number[];
    private currentKeyHoldHandle: string | null = null;

    /** Fixed Media Element used for App sounds. */
    private uiMediaElement = new Audio();

    get onPlaySound(): ExposedEvent<Sound> { return this._onPlaySound.expose(); }
    private readonly _onPlaySound = new Event<Sound>();

    get onStopSound(): ExposedEvent<string> { return this._onStopSound.expose(); }
    private readonly _onStopSound = new Event<string>();

    /** Used when sounds do not overlap. */
    private readonly _onSingleSoundChanged = new Event<AudioInstance | null>();
    get onSingleInstanceChanged(): ExposedEvent<AudioInstance | null> { return this._onSingleSoundChanged.expose(); }

    playingSounds: AudioInstance[] = [];

    constructor(settings: Settings) {
        this.mainDevice = settings.mainDevice;
        this.mainDeviceVolume = settings.mainDeviceVolume;
        this.secondaryDevice = settings.secondaryDevice;
        this.secondaryDeviceVolume = settings.secondaryDeviceVolume;
        this.overlapSounds = settings.overlapSounds;
        this.stopSoundsKeys = settings.stopSoundsKeys;

        GlobalEvents.addHandler("onSettingsChanged", settings => {
            this.overlapSounds = settings.overlapSounds;
            this.mainDevice = settings.mainDevice;
            this.mainDeviceVolume = settings.mainDeviceVolume;
            this.secondaryDevice = settings.secondaryDevice;
            this.secondaryDeviceVolume = settings.secondaryDeviceVolume;
            this.stopSoundsKeys = settings.stopSoundsKeys;
        });

        GlobalEvents.addHandler("onKeybindsStateChanged", s => {
            void this.playUISound(s ? UISoundPath.ON : UISoundPath.OFF);
        });

        GlobalEvents.addHandler("onSoundRemoved", s => {
            this.stopSoundInternal(s.uuid, true);
        });

        GlobalEvents.addHandler("onKeybindPressed", keybind => {
            if (Keys.equals(keybind, this.stopSoundsKeys)) {
                this.stopAllSoundsInternal(true);
            }
        });

        GlobalEvents.addHandler("onSoundPlayRequested", async s => {
            try {
                await this.playSound(s);
            } catch (error) {
                await this.playUISound(UISoundPath.ERROR);
            }
        });
    }

    static parseDevices(settings: Settings): IDevice[] {
        const devices: IDevice[] = [
            { id: settings.mainDevice, volume: settings.mainDeviceVolume }
        ];
        if (settings.secondaryDevice && settings.secondaryDeviceVolume) {
            devices.push({ id: settings.secondaryDevice, volume: settings.secondaryDeviceVolume });
        }
        return devices;
    }

    static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const filtered = devices.filter(d => d.kind == "audiooutput" && d.deviceId != "communications");
        return filtered;
    }

    async playSound(sound: Sound): Promise<void> {
        if (!this.overlapSounds) this.stopAllSoundsInternal(false);

        if (!sound.soundboardUuid) throw Error(MSG_ERR_NOT_CONNECTED);
        const sb = await window.actions.getSoundboard(sound.soundboardUuid);

        // In the future, devices will be stored as an array and the user will be able to add/remove them.
        const devices: IDevice[] = [{ id: this.mainDevice, volume: this.mainDeviceVolume }];
        if (this.secondaryDevice) devices.push({ id: this.secondaryDevice, volume: this.secondaryDeviceVolume });

        const instance = await AudioInstance.create(sound, devices, sb.volume / 100);
        instance.onStop.addHandler(() => {
            console.log(`Instance of ${sound.name} finished playing.`);
            this.playingSounds.splice(this.playingSounds.indexOf(instance), 1);
            this._onStopSound.raise(sound.uuid);
            void this.updatePTTState();
            this.raiseSingleSoundUpdate();
        });

        try {
            await instance.play();
        } catch (error) {
            void this.updatePTTState();
            this.raiseSingleSoundUpdate();
            throw error;
        }

        console.log(`Added and playing instance of sound at ${sound.uuid}.`);
        this.playingSounds.push(instance);
        this._onPlaySound.raise(sound);
        void this.updatePTTState();
        this.raiseSingleSoundUpdate();
    }

    /** Stops all instances of the specified Sound. */
    stopSound(uuid: string): void {
        this.stopSoundInternal(uuid, true);
    }

    stopSounds(uuids: Iterable<string>): void {
        for (const soundId of uuids) {
            this.stopSoundInternal(soundId, false);
        }
    }

    stopAllSounds(): void {
        this.stopAllSoundsInternal(true);
    }

    isSoundPlaying(uuid: string): boolean {
        const instance = this.playingSounds.find(x => x.sound.uuid == uuid);
        return instance !== undefined;
    }

    isAnySoundPlaying(): boolean {
        return this.playingSounds.length > 0;
    }

    async playUISound(path: UISoundPath): Promise<void> {
        this.uiMediaElement.src = path;
        this.uiMediaElement.load();
        await this.uiMediaElement.play();
    }

    private async updatePTTState(): Promise<void> {
        const playing = this.isAnySoundPlaying();
        if (playing && !this.currentKeyHoldHandle) {
            this.currentKeyHoldHandle = await window.actions.holdPTT();
        }
        if (!playing && this.currentKeyHoldHandle) {
            await window.actions.releasePTT(this.currentKeyHoldHandle);
            this.currentKeyHoldHandle = null;
        }
    }

    private raiseSingleSoundUpdate(): void {
        if (this.playingSounds.length == 1) {
            this._onSingleSoundChanged.raise(this.playingSounds[0]);
        } else {
            this._onSingleSoundChanged.raise(null);
        }
    }

    private stopAllSoundsInternal(raiseUpdates: boolean): void {
        const playingSoundsCopy = [...this.playingSounds];
        for (const playingSound of playingSoundsCopy) {
            const id = playingSound.sound.uuid;
            this.stopSoundInternal(id, raiseUpdates);
        }
    }

    private stopSoundInternal(uuid: string, raiseUpdates: boolean): void {
        const instances = this.playingSounds.filter(x => x.sound.uuid == uuid);
        if (instances.length <= 0) return;
        const instancesCopy = [...instances];

        for (const instance of instancesCopy) {
            instance.pause();
            this.playingSounds.splice(this.playingSounds.indexOf(instance), 1);
            this._onStopSound.raise(uuid);
            console.log(`Stopped an instance of the Sound with UUID ${uuid}.`);
        }
        if (raiseUpdates) {
            void this.updatePTTState();
            this.raiseSingleSoundUpdate();
        }
    }
}

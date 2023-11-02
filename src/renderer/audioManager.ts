import { Event, ExposedEvent } from "../shared/events";
import { Settings } from "../shared/models";
import { AudioInstance, UISoundPath } from "./models";
import { IDevice } from "../shared/interfaces";
import GlobalEvents from "./util/globalEvents";
import { Playable, isSound } from "../shared/models/playable";

const MSG_ERR_NOT_CONNECTED = "The sound cannot be played because it is not connected to a Soundboard.";

export default class AudioManager {
    overlapSounds = false;

    private _loops = false;
    get loops(): boolean { return this._loops; }
    set loops(value: boolean) {
        this._loops = value;
        this.playingInstances.forEach(e => e.loop = value);
    }

    private mainDevice: string;
    private mainDeviceVolume: number;
    private secondaryDevice: string;
    private secondaryDeviceVolume: number;
    private currentKeyHoldHandle: string | null = null;

    /** Internal Media Element used for app sounds. */
    private uiMediaElement = new Audio();

    get onPlay(): ExposedEvent<Playable> { return this._onPlay.expose(); }
    private readonly _onPlay = new Event<Playable>();

    get onStop(): ExposedEvent<string> { return this._onStop.expose(); }
    private readonly _onStop = new Event<string>();

    /** Used when sounds do not overlap. */
    private readonly _onSingleInstanceChanged = new Event<AudioInstance | null>();
    get onSingleInstanceChanged(): ExposedEvent<AudioInstance | null> { return this._onSingleInstanceChanged.expose(); }

    playingInstances: AudioInstance[] = [];

    constructor(settings: Settings) {
        this.mainDevice = settings.mainDevice;
        this.mainDeviceVolume = settings.mainDeviceVolume;
        this.secondaryDevice = settings.secondaryDevice;
        this.secondaryDeviceVolume = settings.secondaryDeviceVolume;
        this.overlapSounds = Settings.getActionState(settings, "toggleSoundOverlap");
        this.loops = Settings.getActionState(settings, "toggleSoundLooping");

        GlobalEvents.addHandler("onSettingsChanged", settings => {
            this.overlapSounds = Settings.getActionState(settings, "toggleSoundOverlap");
            this.loops = Settings.getActionState(settings, "toggleSoundLooping");
            this.mainDevice = settings.mainDevice;
            this.mainDeviceVolume = settings.mainDeviceVolume;
            this.secondaryDevice = settings.secondaryDevice;
            this.secondaryDeviceVolume = settings.secondaryDeviceVolume;
        });

        GlobalEvents.addHandler("onKeybindsStateChanged", s => {
            void this.playUISound(s ? UISoundPath.ON : UISoundPath.OFF);
        });

        GlobalEvents.addHandler("onPlayableRemoved", s => {
            this.stop(s.uuid);
        });

        GlobalEvents.addHandler("onStopAllSounds", () => {
            this.stopAll();
        });

        GlobalEvents.addHandler("onPlayRequested", async s => {
            try {
                await this.play(s);
            } catch (error) {
                await this.playUISound(UISoundPath.ERROR);
            }
        });
    }

    static parseDevices(settings: Settings): IDevice[] {
        const devices: IDevice[] = [
            { id: settings.mainDevice, volume: settings.mainDeviceVolume }
        ];
        if (settings.secondaryDevice) {
            devices.push({ id: settings.secondaryDevice, volume: settings.secondaryDeviceVolume });
        }
        return devices;
    }

    static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const filtered = devices.filter(d => d.kind == "audiooutput" && d.deviceId != "communications");
        return filtered;
    }

    async play(playable: Playable): Promise<void> {
        if (!this.overlapSounds) this.stopAllInternal(false);

        if (!playable.soundboardUuid) throw Error(MSG_ERR_NOT_CONNECTED);
        const sb = await window.actions.getSoundboard(playable.soundboardUuid);

        // In the future, devices will be stored as an array and the user will be able to add/remove them.
        const devices: IDevice[] = [{ id: this.mainDevice, volume: this.mainDeviceVolume }];
        if (this.secondaryDevice) devices.push({ id: this.secondaryDevice, volume: this.secondaryDeviceVolume });

        // TODO: Decide which sound on the group to play.
        if (!isSound(playable)) return;

        const instance = await AudioInstance.create(
            { uuid: playable.uuid, volume: playable.volume, path: playable.path },
            devices, sb.volume / 100, this.loops
        );
        instance.onEnd.addHandler(() => {
            console.log(`Instance of ${playable.name} finished playing.`);
            this.playingInstances.splice(this.playingInstances.indexOf(instance), 1);
            this._onStop.raise(playable.uuid);
            void this.updatePTTState();
            this.raiseSingleInstanceCheckUpdate();
        });

        try {
            await instance.play();
        } catch (error) {
            void this.updatePTTState();
            this.raiseSingleInstanceCheckUpdate();
            throw error;
        }

        console.log(`Added and playing instance of sound at ${playable.uuid}.`);
        this.playingInstances.push(instance);
        this._onPlay.raise(playable);
        void this.updatePTTState();
        this.raiseSingleInstanceCheckUpdate();
    }

    /** Stops all instances of the specified Playable. */
    stop(uuid: string): void {
        this.stopInternal(uuid, true);
    }

    stopMultiple(uuids: Iterable<string>): void {
        for (const id of uuids) {
            this.stopInternal(id, false);
        }
        void this.updatePTTState();
        this.raiseSingleInstanceCheckUpdate();
    }

    stopAll(): void {
        this.stopAllInternal(true);
    }

    isPlaying(uuid: string): boolean {
        const instance = this.playingInstances.find(x => x.uuid == uuid);
        return instance !== undefined;
    }

    isAnyPlaying(): boolean {
        return this.playingInstances.length > 0;
    }

    async playUISound(path: UISoundPath): Promise<void> {
        this.uiMediaElement.src = path;
        this.uiMediaElement.load();
        await this.uiMediaElement.play();
    }

    private async updatePTTState(): Promise<void> {
        const playing = this.isAnyPlaying();
        if (playing && !this.currentKeyHoldHandle) {
            this.currentKeyHoldHandle = await window.actions.holdPTT();
        }
        if (!playing && this.currentKeyHoldHandle) {
            await window.actions.releasePTT(this.currentKeyHoldHandle);
            this.currentKeyHoldHandle = null;
        }
    }

    private raiseSingleInstanceCheckUpdate(): void {
        if (this.playingInstances.length == 1) {
            this._onSingleInstanceChanged.raise(this.playingInstances[0]!);
        } else {
            this._onSingleInstanceChanged.raise(null);
        }
    }

    private stopAllInternal(raiseUpdates: boolean): void {
        const playingCopy = [...this.playingInstances];
        for (const playing of playingCopy) {
            const id = playing.uuid;
            this.stopInternal(id, raiseUpdates);
        }
    }

    private stopInternal(uuid: string, raiseUpdates: boolean): void {
        const instances = this.playingInstances.filter(x => x.uuid == uuid);
        if (instances.length <= 0) return;
        const instancesCopy = [...instances];

        for (const instance of instancesCopy) {
            instance.stop();
            this.playingInstances.splice(this.playingInstances.indexOf(instance), 1);
            this._onStop.raise(uuid);
            console.log(`Stopped an instance of the Playable with UUID ${uuid}.`);
        }
        if (raiseUpdates) {
            void this.updatePTTState();
            this.raiseSingleInstanceCheckUpdate();
        }
    }
}

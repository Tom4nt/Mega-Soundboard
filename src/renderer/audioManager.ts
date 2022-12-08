import { Event, ExposedEvent } from "../shared/events";
import { Settings, Sound } from "src/shared/models";
import { UISoundPath } from "./models";
import { IDevice } from "../shared/interfaces";
import GlobalEvents from "./util/globalEvents";

const MSG_ERR_NOT_CONNECTED = "This sound cannot be played because it is not connected to a Soundboard.";

class AudioInstance {
    constructor(public readonly audioElements: HTMLAudioElement[]) { }
    stop(): void {
        this.audioElements.forEach(x => x.pause());
        this.audioElements.length = 0;
    }
}

export default class AudioManager {
    overlapSounds = false;

    private mainDevice: string;
    private mainDeviceVolume: number;
    private secondaryDevice: string | null;
    private secondaryDeviceVolume: number;

    private uiMediaElement = new Audio();

    get onPlaySound(): ExposedEvent<Sound> { return this._onPlaySound.expose(); }
    readonly _onPlaySound = new Event<Sound>();

    get onStopSound(): ExposedEvent<string> { return this._onStopSound.expose(); }
    readonly _onStopSound = new Event<string>();

    playingSounds = new Map<string, AudioInstance[]>;

    constructor(settings: Settings) {
        this.mainDevice = settings.mainDevice;
        this.mainDeviceVolume = settings.mainDeviceVolume;
        this.secondaryDevice = settings.secondaryDevice;
        this.secondaryDeviceVolume = settings.secondaryDeviceVolume;
        this.overlapSounds = settings.overlapSounds;

        GlobalEvents.addHandler("onKeybindsStateChanged", s => {
            if (s) void this.playUISound(UISoundPath.ON);
            else void this.playUISound(UISoundPath.OFF);
        });

        GlobalEvents.addHandler("onOverlapSoundsStateChanged", s => {
            this.overlapSounds = s;
        });

        GlobalEvents.addHandler("onDevicesChanged", s => {
            this.mainDevice = s.mainDevice;
            this.mainDeviceVolume = s.mainDeviceVolume;
            this.secondaryDevice = s.secondaryDevice;
            this.secondaryDeviceVolume = s.secondaryDeviceVolume;
        });

        GlobalEvents.addHandler("onSoundRemoved", s => {
            this.stopSound(s.uuid);
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
        if (!this.overlapSounds) this.stopAllSounds();

        if (!sound.soundboardUuid) throw Error(MSG_ERR_NOT_CONNECTED);
        const sb = await window.actions.getSoundboard(sound.soundboardUuid);
        const soundboardVolume = sb.volume;

        const sinkIdPromises: Promise<void>[] = [];
        const audioElements: HTMLAudioElement[] = [];

        const instance = new AudioInstance(audioElements);

        // In the future, devices will be stored as an array and the user will be able to add/remove them.
        const devices: IDevice[] = [{ id: this.mainDevice, volume: this.mainDeviceVolume }];
        if (this.secondaryDevice) devices.push({ id: this.secondaryDevice, volume: this.secondaryDeviceVolume });

        for (const device of devices) {
            const audio = new Audio(sound.path);

            audio.addEventListener("ended", () => {
                audioElements.splice(audioElements.indexOf(audio), 1);
                if (audioElements.length <= 0) {
                    console.log(`Instance of ${sound.name} finished playing.`);
                    const instances = this.playingSounds.get(sound.uuid);
                    instances?.splice(instances.indexOf(instance), 1);
                    this._onStopSound.raise(sound.uuid);
                }
            });

            audio.volume = Math.pow((device.volume / 100) * (sound.volume / 100) * (soundboardVolume / 100), 2);
            const p = audio.setSinkId(device.id).catch(() => { console.error(`Error setting SinkId for ${device.id}.`); });
            sinkIdPromises.push(p);
            audioElements.push(audio);
        }

        console.log(`Added and playing instance of sound at ${sound.uuid}.`);
        await Promise.all(sinkIdPromises);

        const playTasks: Promise<void>[] = [];
        for (const audioElement of audioElements) {
            const t = audioElement.play();
            playTasks.push(t);
        }

        await Promise.all(playTasks);

        const instances = this.playingSounds.get(sound.uuid);
        if (instances) {
            instances.push(instance);
        }
        else {
            this.playingSounds.set(sound.uuid, [instance]);
        }

        this._onPlaySound.raise(sound);
    }

    /** Stops all instances of the specified Sound. */
    stopSound(uuid: string): void {
        const instances = this.playingSounds.get(uuid);
        if (!instances || instances.length <= 0) return;
        const instancesCopy = [...instances];

        for (const instance of instancesCopy) {
            instance.stop();
            instances.splice(instances.indexOf(instance), 1);
            this._onStopSound.raise(uuid);
            console.log(`Stopped an instance of the Sound with UUID ${uuid}.`);
        }
    }

    stopSounds(uuids: Iterable<string>): void {
        for (const soundId of uuids) {
            this.stopSound(soundId);
        }
    }

    stopAllSounds(): void {
        for (const playingSound of this.playingSounds) {
            const id = playingSound[0];
            this.stopSound(id);
        }
    }

    isSoundPlaying(uuid: string): boolean {
        const instances = this.playingSounds.get(uuid);
        return instances !== undefined && instances.length > 0;
    }

    async playUISound(path: UISoundPath): Promise<void> {
        this.uiMediaElement.src = path;
        this.uiMediaElement.load();
        await this.uiMediaElement.play();
    }
}

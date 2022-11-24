import { Event, ExposedEvent } from "../shared/events";
import { Sound } from "src/shared/models";
import { UISoundPath } from "./models";
import { IDevice } from "../shared/interfaces";

const MSG_ERR_NOT_CONNECTED = "This sound cannot be played because it is not connected to a Soundboard.";

class AudioInstance {
    constructor(public readonly audioElements: HTMLAudioElement[]) { }
    stop(): void {
        this.audioElements.forEach(x => x.pause());
        this.audioElements.length = 0;
    }
}

export default class AudioManager {
    devices: IDevice[] = [{ id: "default", volume: 100 }];
    overlapSounds = false;

    private uiMediaElement = new Audio();

    get onPlaySound(): ExposedEvent<Sound> { return this._onPlaySound.expose(); }
    readonly _onPlaySound = new Event<Sound>();

    get onStopSound(): ExposedEvent<string> { return this._onStopSound.expose(); }
    readonly _onStopSound = new Event<string>();

    playingSounds = new Map<string, AudioInstance[]>;

    constructor() {
        window.events.onKeybindsStateChanged.addHandler(s => {
            if (s) void this.playUISound(UISoundPath.ON);
            else void this.playUISound(UISoundPath.OFF);
        });

        window.events.onOverlapSoundsStateChanged.addHandler(s => {
            this.overlapSounds = s;
        });
    }

    static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const filtered = devices.filter(d => d.kind == "audiooutput" && d.deviceId != "communications");
        return filtered;
    }

    async playSound(sound: Sound): Promise<void> {
        if (!this.overlapSounds) this.stopAllSounds();

        if (!sound.soundboard) throw Error(MSG_ERR_NOT_CONNECTED);
        const soundboardVolume = sound.soundboard.volume;

        const sinkIdPromises: Promise<void>[] = [];
        const audioElements: HTMLAudioElement[] = [];

        const instance = new AudioInstance(audioElements);

        for (const device of this.devices) {
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
        if (instances && instances.length > 0) {
            for (const instance of instances) {
                instance.stop();
            }
            this.playingSounds.set(uuid, []);
            console.log(`Stopped all instances of sound with UUID ${uuid}.`);
            this._onStopSound.raise(uuid);
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

    async playUISound(path: UISoundPath): Promise<void> {
        this.uiMediaElement.src = path;
        this.uiMediaElement.load();
        await this.uiMediaElement.play();
    }
}

import { Event, ExposedEvent } from "../shared/events";
import { Sound } from "src/shared/models";
import { UISoundPath } from "./models";
import { IDevice } from "../shared/interfaces";

const MSG_ERR_NOT_CONNECTED = "This sound cannot be played because it is not connected to a Soundboard.";

export default class AudioManager {
    devices: IDevice[] = [{ id: "default", volume: 100 }];
    overlapSounds = false;

    private uiMediaElement = new Audio();

    get onPlaySound(): ExposedEvent<Sound> { return this._onPlaySound.expose(); }
    readonly _onPlaySound = new Event<Sound>();

    get onStopSound(): ExposedEvent<string> { return this._onStopSound.expose(); }
    readonly _onStopSound = new Event<string>();

    playingSounds = new Map<string, HTMLAudioElement[]>;

    constructor() {
        window.events.onKeybindsStateChanged.addHandler(s => {
            if (s) void this.playUISound(UISoundPath.ON);
            else void this.playUISound(UISoundPath.OFF);
        });

        window.events.onOverlapSoundsStateChanged.addHandler(s => {
            this.overlapSounds = s;
        });

        window.events.onDevicesChanged.addHandler(devices => {
            this.devices = devices;
        });
    }

    async playSound(sound: Sound): Promise<void> {
        if (!this.overlapSounds) this.stopAllSounds();

        if (!sound.connectedSoundboard) throw Error(MSG_ERR_NOT_CONNECTED);
        const soundboardVolume = sound.connectedSoundboard.volume;

        const sinkIdPromises: Promise<void>[] = [];
        const audioElements: HTMLAudioElement[] = [];

        for (const device of this.devices) {
            const audio = new Audio(sound.path);

            audio.addEventListener("ended", () => {
                const instances = this.playingSounds.get(sound.uuid);
                instances?.splice(instances.indexOf(audio), 1);
                if (instances && instances.length <= 0) {
                    console.log(`All instances of ${sound.name} finished playing.`);
                    this._onStopSound.raise(sound.uuid);
                }
            });

            audio.volume = Math.pow((device.volume / 100) * (sound.volume / 100) * (soundboardVolume / 100), 2);
            const p = audio.setSinkId(device.id).catch(() => { console.error(`Error setting SinkId for ${device.id}.`); });
            sinkIdPromises.push(p);
            audioElements.push(audio);
        }

        console.log(`Added and playing ${this.devices.length} instances of sound at ${sound.name}.`);
        await Promise.all(sinkIdPromises);

        const playTasks: Promise<void>[] = [];
        for (const audioElement of audioElements) {
            const t = audioElement.play();
            playTasks.push(t);
        }

        await Promise.all(playTasks);

        const instances = this.playingSounds.get(sound.uuid);
        if (!instances) {
            this.playingSounds.set(sound.uuid, audioElements);
        } else {
            instances.push(...audioElements);
        }

        this._onPlaySound.raise(sound);
    }

    stopSound(uuid: string): void {
        const instances = this.playingSounds.get(uuid);
        if (instances) {
            for (const instance of instances) {
                instance.pause();
            }
            this.playingSounds.set(uuid, []);
            console.log(`Stopped all instances of sound with UUID ${uuid}.`);
            this._onStopSound.raise(uuid);
        }
    }

    stopSounds(uuids: Iterable<string>): void {
        for (const sound of uuids) {
            this.stopSound(sound);
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
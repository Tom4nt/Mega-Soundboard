import { Event, ExposedEvent } from "../shared/events";
import { Sound, UISoundPath } from "src/shared/models";

type StringDictionary = { [index: string]: string };

const MSG_ERR_NOT_SUPPORTED = "Could not play the sound. The file is not supported, malformed or corrupted.";
const MSG_ERR_NOT_CONNECTED = "This sound cannot be played because it is not connected to a Soundboard.";

export default class AudioManager {
    volume1 = 100;
    volume2 = 100;
    device1 = "default";
    device2: string | null = null; // TODO: Listen to preload events and update volumes and devices

    private uiMediaElement = new Audio();

    get onPlaySound(): ExposedEvent<Sound> { return this._onPlaySound.expose(); }
    readonly _onPlaySound = new Event<Sound>();

    get onStopSound(): ExposedEvent<Sound> { return this._onStopSound.expose(); }
    readonly _onStopSound = new Event<Sound>();

    get onStopAllSounds(): ExposedEvent<void> { return this._onStopAllSounds.expose(); }
    readonly _onStopAllSounds = new Event<void>();

    playingSounds: StringDictionary = {}; // TODO: Make Sounds use UUIDs (key). Sound path is the value.

    constructor() {
        window.events.onKeybindsStateChanged.addHandler(s => {
            if (s) void this.playUISound(UISoundPath.ON);
            else void this.playUISound(UISoundPath.OFF);
        });
    }

    async playSound(sound: Sound): Promise<void> {
        // if (!this.settings.overlapSounds) this.stopAllSounds(); // TODO

        // TODO: Catch Audio error instead.
        // if (!fs.existsSync(url)) {
        //     throw `'${url}' could not be found. If the file exists make sure Mega Soundboard has permission to access it.`;
        // }
        const audio1 = new Audio(sound.path);
        const audio2 = new Audio(sound.path);

        console.log(`Added and playing 2 instances of sound at ${sound.name}.`);

        // TODO: Use UUIDs to check if a sound is playing and raise event.

        audio1.addEventListener("ended", () => {
            // this.mediaElements.splice(this.mediaElements.indexOf(sound), 1);
            // if (this.mediaElements.length < 1) {
            console.log(`All instances of ${sound.name} finished playing.`);
            // this._onStopSound.raise()
            // }
        });

        audio2.addEventListener("ended", () => {
            // this.mediaElements.splice(this.mediaElements.indexOf(sound2), 1);
            // if (this.mediaElements.length < 1) {
            console.log(`All instances of ${sound.name} finished playing.`);
            // onend(this);
            // }
        });

        if (!sound.connectedSoundboard) throw MSG_ERR_NOT_CONNECTED;
        const soundboardVolume = sound.connectedSoundboard.volume;

        audio1.volume = Math.pow((this.volume1 / 100) * (sound.volume / 100) * (soundboardVolume / 100), 2);
        audio2.volume = Math.pow((this.volume2 / 100) * (sound.volume / 100) * (soundboardVolume / 100), 2);

        const p1 = audio1.setSinkId(this.device1).catch(() => { console.error("Device 1 was not found."); });
        let p2 = Promise.resolve();
        if (this.device2) p2 = audio2.setSinkId(this.device2).catch(() => { console.error("Device 2 was not found."); });

        await Promise.all([p1, p2]);

        const playTask1 = audio1.play().catch(() => {
            throw MSG_ERR_NOT_SUPPORTED;
        });
        const playTasks = [playTask1];

        // this.mediaElements.push(sound, sound2);

        if (this.device2) {
            const playTask2 = audio2.play().catch(() => {
                throw MSG_ERR_NOT_SUPPORTED;
            });
            playTasks.push(playTask2);
        } else {
            // this.mediaElements.splice(this.mediaElements.indexOf(audio2), 1);
        }

        await Promise.all(playTasks);
    }

    stopSound(uuid: string): void {
        const playing = this.playingSounds[uuid];
        if (playing) {
            // TODO: Stop media elements (both devices) and remove item. Fire event
        }
        console.log(`Stopped all instances of sound with UUID ${uuid}.`);
    }

    stopAllSounds(): void {
        // TODO: Iterate through playing sounds and call stopSound on each one
    }

    async playUISound(path: UISoundPath): Promise<void> {
        this.uiMediaElement.src = path;
        this.uiMediaElement.load();
        await this.uiMediaElement.play();
    }
}
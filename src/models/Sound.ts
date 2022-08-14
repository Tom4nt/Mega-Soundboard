import * as fs from "fs"; // TODO: Remove fs reference
import Utils from "./Utils";

const MSG_ERR_NOT_SUPPORTED = "Could not play the sound. The file is not supported, malformed or corrupted.";

type JSONSound = { name: string, path: string, volume: number, keys: string[] };

export default class Sound {
    playing: boolean;
    mediaElements: HTMLMediaElement[];

    constructor(
        public name: string,
        public path: string,
        public volume: number,
        public keys: string[],
        public askParentVolume: () => number) {

        this.mediaElements = [];
        this.playing = false;
    }

    toJSON(): JSONSound {
        return {
            name: this.name,
            path: this.path,
            volume: this.volume,
            keys: this.keys
        };
    }

    static fromData(data: Map<string, unknown>, onAskParentVolume: () => number): Sound {
        // Defaults
        let name = "¯\\_(ツ)_/¯";
        let path = "¯\\_(ツ)_/¯";
        let volume = 100;
        let keys: string[] = [];

        if (typeof data.get("name") === "string") name = data.get("name") as string;

        const pathRes = Utils.tryGetValue(data, ["path", "url"], v => typeof v === "string");
        if (pathRes) path = pathRes as string;

        if (typeof data.get("volume") === "number") volume = data.get("volume") as number;

        const keysRes = Utils.tryGetValue(data, ["keys", "shortcut"], v => Utils.isKeys(v));
        if (keysRes) keys = data.get("keys") as string[];

        return new Sound(name, path, volume, keys, onAskParentVolume);
    }

    async play(onend: (sound: Sound) => void, volume1: number, volume2: number, device1: string, device2: string): Promise<void> {
        const url = this.path;
        if (!fs.existsSync(url)) {
            throw `'${url}' could not be found. It was moved, deleted or perhaps never existed...<br/>
                    If the file exists make sure Mega Soundboard has permission to access it.`;
        }
        const sound = new Audio(url);
        const sound2 = new Audio(url);

        console.log("Added and playing 2 instances of " + this.name + ".");

        sound.addEventListener("ended", () => {
            this.mediaElements.splice(this.mediaElements.indexOf(sound), 1);
            if (this.mediaElements.length < 1) {
                this.playing = false;
                console.log("All instances of " + this.name + " finished playing.");
                onend(this);
            }
        });

        sound2.addEventListener("ended", () => {
            this.mediaElements.splice(this.mediaElements.indexOf(sound2), 1);
            if (this.mediaElements.length < 1) {
                this.playing = false;
                console.log("All instances of " + this.name + " finished playing.");
                onend(this);
            }
        });

        const soundboardVolume = this.askParentVolume();

        sound.volume = Math.pow((volume1 / 100) * (this.volume / 100) * (soundboardVolume / 100), 2);
        sound2.volume = Math.pow((volume2 / 100) * (this.volume / 100) * (soundboardVolume / 100), 2);
        const p1 = sound.setSinkId(device1 ? device1 : "default").catch(() => { console.error("Device 1 was not found."); });
        const p2 = sound2.setSinkId(device2 ? device2 : "default").catch(() => { console.error("Device 2 was not found."); });

        await Promise.all([p1, p2]);

        const playTask1 = sound.play().catch(() => {
            throw MSG_ERR_NOT_SUPPORTED;
        });
        const playTasks = [playTask1];

        this.mediaElements.push(sound, sound2);
        this.playing = true;

        if (device2) {
            const playTask2 = sound2.play().catch(() => {
                throw MSG_ERR_NOT_SUPPORTED;
            });
            playTasks.push(playTask2);
        } else {
            this.mediaElements.splice(this.mediaElements.indexOf(sound2), 1);
        }

        await Promise.all(playTasks);
    }

    stop(): void {
        for (let i = 0; i < this.mediaElements.length; i++) {
            const mediaElement = this.mediaElements[i];
            mediaElement.pause();
            this.mediaElements.splice(i, 1);
            i--;
        }
        this.playing = false;
        console.log("Stopped all instances of " + this.name + ".");
    }

    isPlaying(): boolean {
        return this.playing;
    }
}
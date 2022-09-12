import * as fs from "fs"; // TODO: Remove reference.
import * as p from "path"; // TODO: Remove reference.
import { Event, ExposedEvent } from "../events";
import { Sound, Utils } from "../models";
import { IEquatable } from "../interfaces";

type SoundboardEventArgs = { soundboard: Soundboard, sound: Sound };

export default class Soundboard implements IEquatable<Soundboard> {
    // TODO: Remove dependency on events
    public static get addToFolder(): ExposedEvent<SoundboardEventArgs> { return this.onAddToFolder.expose(); }
    public static get removeFromFolder(): ExposedEvent<SoundboardEventArgs> { return this.onRemoveFromFolder.expose(); }

    private static readonly onAddToFolder = new Event<SoundboardEventArgs>();
    private static readonly onRemoveFromFolder = new Event<SoundboardEventArgs>();

    private fileWatcher: fs.FSWatcher | null = null;

    constructor();
    constructor(name: string, keys: number[], volume: number, linkedFolder: string | null, sounds: Sound[]);
    constructor(
        public name: string = "Default",
        public keys: number[] = [],
        public volume: number = 100,
        public linkedFolder: string | null = null,
        public sounds: Sound[] = []) {

        if (!volume) volume = 100;
        if (!linkedFolder) this.linkedFolder = null;
        if (linkedFolder) {
            this.syncSounds(linkedFolder);
            this.setupFolderListener();
        }
    }

    equals(to: Soundboard): boolean {
        return this.name === to.name &&
            this.keys === to.keys &&
            this.volume === to.volume &&
            this.linkedFolder === to.linkedFolder;
    }

    static fromSoundboardData(data: Map<string, unknown>): Soundboard {
        let name = "¯\\_(ツ)_/¯";
        if (typeof data.get("name") === "string") name = data.get("name") as string;

        let keys: number[] = [];
        if (Utils.isKeys(data.get("keys"))) keys = data.get("keys") as number[];

        let volume = 100;
        if (typeof data.get("volume") === "number") volume = data.get("volume") as number;

        let linkedFolder: string | null = null;
        if (typeof data.get("linkedFolder") === "string") linkedFolder = data.get("linkedFolder") as string;

        const sb = new Soundboard(name, keys, volume, linkedFolder, []);

        if (linkedFolder) {
            sb.syncSounds(linkedFolder);
            sb.setupFolderListener();
        } else {
            let sounds: Sound[] = [];
            if (Array.isArray(data.get("sounds")))
                sounds = sb.getSoundsFromData(data.get("sounds") as unknown[]);
            sb.sounds = sounds;
        }

        return sb;
    }

    getSoundsFromData(data: unknown[]): Sound[] {
        const sounds: Sound[] = [];
        data.forEach(sound => {
            if (sound && typeof sound === "object") {
                const s = Sound.fromData(Utils.objectToMap(sound));
                s.connectToSoundboard(this);
                sounds.push(s);
            }
        });
        return sounds;
    }

    // TODO: Isolate this function in the main process. (It does I/O)
    syncSounds(linkedFolderPath: string): void {
        if (!fs.existsSync(linkedFolderPath)) return;
        if (!fs.statSync(linkedFolderPath).isDirectory()) return;

        const files = fs.readdirSync(linkedFolderPath);

        // Loop through files and add unexisting sounds
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const path = p.join(linkedFolderPath, file);
            if (Utils.isValidSoundFile(path)) {
                const soundWithPath = this.getSoundWithPath(path);
                if (!soundWithPath && fs.statSync(path).isFile()) {
                    const s = new Sound(p.basename(file, p.extname(file)), path, 100, []);
                    s.connectToSoundboard(this);
                    this.sounds.push();
                }
            }
        }

        // Loop through existing sounds and remove those without a file
        if (this.sounds.length > 0) {
            for (let i = this.sounds.length - 1; i >= 0; i--) {
                const sound = this.sounds[i];

                // Does the folder contain this sound?
                let contains = false;
                for (const file of files) {
                    const path = p.join(linkedFolderPath, file);
                    if (p.resolve(sound.path) == p.resolve(path)) contains = true;
                }

                if (!contains) this.sounds.splice(i, 1);
            }
        }
    }

    // TODO: Isolate this function in the main process. (It does I/O)
    setupFolderListener(): void {
        if (!this.linkedFolder) return;
        if (!fs.existsSync(this.linkedFolder)) return;
        if (!fs.statSync(this.linkedFolder).isDirectory()) return;

        const folder = this.linkedFolder;
        if (folder) {
            this.fileWatcher = fs.watch(folder, (e, file) => {
                if (e != "rename") return;
                const path = p.join(folder, file);
                const exists = fs.existsSync(path);
                if (exists) {
                    const stats = fs.statSync(path);
                    if (!stats.isFile() || !Utils.isValidSoundFile(path)) return;
                    console.log("Added " + file);
                    const sound = new Sound(Utils.getNameFromFile(file), path, 100, []);
                    sound.connectToSoundboard(this);
                    Soundboard.onAddToFolder.raise({ soundboard: this, sound: sound });
                }
                else {
                    if (!Utils.isValidSoundFile(path)) return;
                    const sound = this.getSoundWithPath(path);
                    if (sound) {
                        console.log("Removed " + file);
                        Soundboard.onRemoveFromFolder.raise({ soundboard: this, sound: sound });
                    }
                }
            });
        }
    }

    removeFolderListener(): void {
        if (this.fileWatcher) this.fileWatcher.close();
    }

    getSoundWithPath(path: string): Sound | null {
        for (let i = 0; i < this.sounds.length; i++) {
            const sound = this.sounds[i];
            if (p.resolve(sound.path) == p.resolve(path)) return sound;
        }
        return null;
    }

    addSound(sound: Sound, index?: number): void {
        if (!index) this.sounds.push(sound);
        else this.sounds.splice(index, 0, sound);
    }

    removeSound(sound: Sound): void {
        this.sounds.splice(this.sounds.indexOf(sound), 1);
    }
}
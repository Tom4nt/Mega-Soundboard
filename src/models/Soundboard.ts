import * as fs from "fs"; // TODO: Remove reference.
import * as p from "path"; // TODO: Remove reference.
import Sound from "./Sound";
import Utils from "./Utils";

// type SoundboardEvent = ["removedfromfolder", "addedtofolder"];

export enum SoundboardEvent {
    REMOVED_FROM_FOLDER = "removedfromfolder",
    ADDED_TO_FOLDER = "addedtofolder"
}

export default class Soundboard {
    static eventDispatcher: EventTarget = new EventTarget();

    private fileWatcher: fs.FSWatcher | null = null;

    constructor();
    constructor(name: string, keys: string[], volume: number, linkedFolder: string | null, sounds: Sound[]);
    constructor(
        public name: string = "Default",
        public keys: string[] = [],
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

    static fromSoundboardData(data: Map<string, unknown>): Soundboard {
        let name = "¯\\_(ツ)_/¯";
        if (typeof data.get("name") === "string") name = data.get("name") as string;

        let keys: string[] = [];
        if (Utils.isKeys(data.get("keys"))) keys = data.get("keys") as string[];

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
                sounds = sb.getSoundsFromData(data.get("sounds") as Array<unknown>);
            sb.sounds = sounds;
        }

        return sb;
    }

    getSoundsFromData(data: unknown[]): Sound[] {
        const sounds: Sound[] = [];
        data.forEach(sound => {
            if (typeof sound === "object") {
                const s = Sound.fromData(sound as Map<string, unknown>, () => this.volume);
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
                    this.sounds.push(new Sound(p.basename(file, p.extname(file)), path, 100, [], () => this.volume));
                }
            }
        }

        // Loop through existing sounds and remove those without a file
        if (this.sounds.length > 0) {
            for (let i = this.sounds.length - 1; i >= 0; i--) {
                const sound = this.sounds[i];

                // Does the folder contain this sound?
                let contains = false;
                files.forEach(file => {
                    const path = p.join(linkedFolderPath, file);
                    if (p.resolve(sound.path) == p.resolve(path)) contains = true;
                });

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
                    const sound = new Sound(Utils.getNameFromFile(file), path, 100, [], () => this.volume);
                    const detail = { soundboard: this, sound: sound };
                    Soundboard.eventDispatcher.dispatchEvent(new CustomEvent(SoundboardEvent.ADDED_TO_FOLDER, { detail }));
                }
                else {
                    if (!Utils.isValidSoundFile(path)) return;
                    const sound = this.getSoundWithPath(path);
                    if (sound) {
                        console.log("Removed " + file);
                        const detail = { soundboard: this, sound: sound };
                        Soundboard.eventDispatcher.dispatchEvent(new CustomEvent(SoundboardEvent.REMOVED_FROM_FOLDER, { detail }));
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

    addSound(sound: Sound, index: number): void {
        if (index === undefined || index === null) this.sounds.push(sound);
        else this.sounds.splice(index, 0, sound);
    }

    removeSound(sound: Sound): void {
        this.sounds.splice(this.sounds.indexOf(sound), 1);
    }
}
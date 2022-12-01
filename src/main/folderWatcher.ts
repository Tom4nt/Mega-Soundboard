import { promises as fs } from "fs";
import * as p from "path";
import Utils from "./utils/utils";
import { Event, ExposedEvent } from "../shared/events";
import SoundUtils from "./utils/soundUtils";
import { Sound, Soundboard } from "../shared/models";
import { randomUUID } from "crypto";

export default class FolderWatcher {
    private watcher: AsyncIterable<fs.FileChangeInfo<string>>;
    private folder: string;
    private abortFlag = false;

    get onSoundAdded(): ExposedEvent<string> { return this._onSoundAdded.expose(); }
    private readonly _onSoundAdded = new Event<string>();

    get onSoundRemoved(): ExposedEvent<string> { return this._onSoundRemoved.expose(); }
    private readonly _onSoundRemoved = new Event<string>();

    constructor(folderPath: string) {
        this.folder = folderPath;
        this.watcher = fs.watch(folderPath);
    }

    async start(): Promise<void> {
        await this.verifyFolder();
        void this.listen();
    }

    private async listen(): Promise<void> {
        for await (const info of this.watcher) {
            if (this.abortFlag) return;
            void this.handleChange(info);
        }
    }

    stop(): void {
        this.abortFlag = true;
    }

    /** Adds Sounds to and/or removes them from the specified Soundboard as necessary
     * to sync them with its linked folder. */
    async syncSounds(soundboard: Soundboard): Promise<void> {
        if (!soundboard.linkedFolder) return;
        await this.verifyFolder();

        const files = await fs.readdir(this.folder);

        // Loop through files and add unexisting sounds
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const path = p.join(soundboard.linkedFolder, file);
            if (SoundUtils.isValidSoundFile(path)) {
                const soundWithPath = Soundboard.getSoundWithPath(soundboard, path);
                const stat = await fs.stat(path);
                if (!soundWithPath && stat.isFile()) {
                    const s = new Sound(randomUUID(), Utils.getNameFromFile(path), path, 100, []);
                    s.soundboard = soundboard;
                    soundboard.sounds.push(s);
                }
            }
        }

        // Loop through existing sounds and remove those without a file
        if (soundboard.sounds.length > 0) {
            for (let i = soundboard.sounds.length - 1; i >= 0; i--) {
                const sound = soundboard.sounds[i];
                const contains = FolderWatcher.folderContains(soundboard.linkedFolder, files, sound.path);
                if (!contains) soundboard.sounds.splice(i, 1);
            }
        }
    }

    private async handleChange(info: fs.FileChangeInfo<string>): Promise<void> {
        if (info.eventType != "rename") return;
        const path = p.join(this.folder, info.filename);
        const exists = await Utils.isPathOK(path);

        if (exists) {
            const stat = await fs.stat(path);
            if (!stat.isFile() || !SoundUtils.isValidSoundFile(path)) return;
            console.log(`Added ${path}`);
            this._onSoundAdded.raise(path);
        }

        else {
            if (!SoundUtils.isValidSoundFile(path)) return;
            console.log(`Removed ${path}`);
            this._onSoundRemoved.raise(path);
        }
    }

    private static folderContains(basePath: string, files: string[], fileToCompare: string): boolean {
        let contains = false;
        for (const file of files) {
            const path = p.join(basePath, file);
            if (p.resolve(fileToCompare) == p.resolve(path)) contains = true;
        }
        return contains;
    }

    private async verifyFolder(): Promise<void> {
        if (!await Utils.isPathOK(this.folder))
            throw Error("The specified path cannot be accessed.");
        if (!(await fs.stat(this.folder)).isDirectory())
            throw Error("The specified path is not valid because it is not a directory.");
    }
}

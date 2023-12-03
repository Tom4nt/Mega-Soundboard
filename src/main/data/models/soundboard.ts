import { promises as fs } from "fs";
import path = require("path");
import { tryGetValue } from "../../../shared/sharedUtils";
import Utils from "../../utils/utils";
import { CommonInfo } from "./commonInfo";
import { Container } from "./container";
import { IPlayable, ICommon, IContainer, IVolumeSource, JSONObject } from "./interfaces";
import { Sound } from "./sound";
import { randomUUID } from "crypto";

export class Soundboard implements IContainer, IVolumeSource, ICommon {
    constructor(
        private readonly info: CommonInfo,
        private readonly container: IContainer,
        public linkedFolder: string | null,
    ) { }

    get uuid(): string { return this.info.uuid; }
    get name(): string { return this.info.name; }
    set name(value: string) { this.info.name = value; }
    get volume(): number { return this.info.volume; }
    set volume(value: number) { this.info.volume = value; }
    get keys(): number[] { return this.info.keys; }

    addPlayable(playable: IPlayable): void {
        this.container.addPlayable(playable);
    }

    removePlayable(playable: IPlayable): void {
        this.container.removePlayable(playable);
    }

    containsPlayable(playable: IPlayable): boolean {
        return this.container.containsPlayable(playable);
    }

    getPlayables(): readonly IPlayable[] {
        return this.container.getPlayables();
    }

    findPlayableRecursive(uuid: string): IPlayable | undefined {
        return this.container.findPlayableRecursive(uuid);
    }

    getVolume(): number {
        return this.info.volume;
    }

    compare(other: ICommon): number {
        return this.info.compare(other);
    }

    getDefault(uuid: string, name: string): Soundboard {
        const info = new CommonInfo(uuid, name, 100, []);
        return new Soundboard(info, new Container([]), null);
    }

    /** Adds Sounds to and/or removes them from the specified Soundboard as necessary
     * to sync them with its linked folder. */
    async syncSounds(): Promise<void> {
        if (!this.linkedFolder) return;
        await Utils.assertAccessibleDirectory(this.linkedFolder);
        const files = await fs.readdir(this.linkedFolder);

        // Loop through files and add unexisting sounds
        for (let i = 0; i < files.length; i++) {
            const file = files[i]!;
            const soundPath = path.join(this.linkedFolder, file);
            if (!Sound.isValidSoundFile(soundPath)) return;
            const soundWithPath = getSoundWithPath(this.container.findPlayableRecursive(), soundPath);
            const stat = await fs.stat(soundPath);
            if (!soundWithPath && stat.isFile()) {
                const s: Sound = {
                    uuid: randomUUID(),
                    name: Utils.getNameFromFile(soundPath),
                    path: soundPath,
                    volume: 100,
                    keys: [],
                };
                this.container.addPlayable(s);
            }
        }

        // Loop through existing sounds and remove those without a file
        if (this.container.getPlayables().length > 0) {
            // removeSubSounds
            this.container.removePlayable(soundboard.linkedFolder, files);
        }
    }

    static convert(data: JSONObject): Soundboard {
        const commonInfo = CommonInfo.convert(data);

        let linkedFolder: string | null = null;
        if (typeof data["linkedFolder"] === "string") linkedFolder = data["linkedFolder"];

        let playables: IPlayable[] = [];
        const playablesTry = tryGetValue(data, ["playables", "sounds"], x => Array.isArray(x));
        if (playablesTry) {
            playables = Container.convertPlayables(playablesTry as []);
        }

        const container = new Container(playables);
        return new Soundboard(commonInfo, container, linkedFolder);
    }
}

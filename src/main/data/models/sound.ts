import * as p from "path";
import { randomUUID } from "crypto";
import { tryGetValue } from "../../../shared/sharedUtils";
import { CommonInfo } from "./commonInfo";
import { ICommon, IContainer, IPlayable, IVolumeSource, JSONObject } from "./interfaces";
import Utils from "../../utils/utils";
import { validSoundExts } from "../../../shared/sharedUtils";
import { ISoundData } from "../../../shared/models/data";

export class Sound implements IPlayable {
    readonly parent: (IContainer & IVolumeSource) | null = null;

    constructor(
        private readonly info: CommonInfo,
        public path: string,
    ) { }

    get uuid(): string { return this.info.uuid; }
    get name(): string { return this.info.name; }
    set name(value: string) { this.info.name = value; }
    get volume(): number { return this.info.volume; }
    set volume(value: number) { this.info.volume = value; }
    get keys(): number[] { return this.info.keys; }

    getAudioPath(): string {
        return this.path;
    }

    getVolume(): number {
        return ((this.parent?.getVolume() ?? 0) / 100) * (this.info.volume / 100);
    }

    getSavable(): JSONObject {
        return {
            ...this.info.getSavable(),
            path: this.path,
        };
    }

    copy(): Sound {
        return Sound.convert(this.getSavable());
    }

    compare(other: ICommon): number {
        return this.info.compare(other);
    }

    edit(data: ISoundData): void {
        this.info.name = data.name;
        this.info.volume = data.volume;
        this.path = data.path;

        this.info.keys.length = 0;
        this.info.keys.push(...data.keys);
    }

    static fromData(data: ISoundData): Sound {
        return new Sound(CommonInfo.fromData(data), data.path);
    }

    static isSound(data: IPlayable): data is Sound {
        return "path" in data || "url" in data;
    }

    static convert(data: JSONObject): Sound {
        const info = CommonInfo.convert(data);

        let path: string = "?";
        const pathRes = tryGetValue(data, ["path", "url"], v => typeof v === "string");
        if (pathRes) path = pathRes as string;

        return new Sound(info, path);
    }

    static getNewSoundsFromPaths(paths: string[]): Sound[] {
        return Array.from(this.iterateSoundsFromPaths(paths));
    }

    static *iterateSoundsFromPaths(paths: string[]): Generator<Sound> {
        for (const path of paths) {
            const info = new CommonInfo(randomUUID(), Utils.getNameFromFile(path), 100, []);
            yield new Sound(info, path);
        }
    }

    static isValidSoundFile(path: string): boolean {
        let ext = p.extname(path);
        if (ext.startsWith(".")) ext = ext.substring(1);
        return validSoundExts.includes(ext);
    }

    static getValidSoundPaths(paths: string[]): string[] {
        return paths.filter(x => this.isValidSoundFile(x));
    }
}

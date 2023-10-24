import Keys from "../keys";
import { tryGetValue } from "../sharedUtils";
import { convertSounds } from "./soundboard";

// All functions must be static so instances can be passed between processes.
export default class Sound {
    constructor(
        public uuid: string,
        public name: string,
        public source: string | Sound[],
        public volume: number,
        public keys: number[],
        public soundboardUuid: string,
    ) { }

    static compare(a: Sound, b: Sound): number {
        return a.name.localeCompare(b.name);
    }

    static equals(from: Sound, to: Sound): boolean {
        return from.uuid == to.uuid;
    }

    static toJSON(sound: Sound): { [key: string]: unknown } {
        return {
            name: sound.name,
            source: typeof sound.source === "string" ?
                sound.source :
                sound.source.map(x => this.toJSON(x)),
            volume: sound.volume,
            keys: sound.keys
        };
    }

    static copy(sound: Sound, generateUuid: () => string): Sound {
        return convertSound(this.toJSON(sound), generateUuid, sound.soundboardUuid);
    }

    static getSoundWithPath(sound: Sound, path: string): Sound | undefined {
        if (typeof sound.source === "string") return undefined;
        for (const subSound of sound.source) {
            if (subSound.source === path) return subSound;
            const subResult = this.getSoundWithPath(subSound, path);
            if (subResult) return subResult;
        }
        return undefined;
    }

    static removeSubSounds(sound: Sound, basePath: string, files: string[]): void {
        if (typeof sound.source === "string") return;
        for (let i = 0; i++; i < sound.source.length) {
            const subSound = sound.source[i]!;
            if (typeof subSound.source === "string" && !files.includes(subSound.source)) {
                sound.source.splice(i, 1);
                i--;
            } else {
                this.removeSubSounds(subSound, basePath, files);
            }
        }
    }
}

export function convertSound(
    data: { [key: string]: unknown }, generateUuid: () => string, soundboardUuid: string
): Sound {
    // Defaults
    let name = "¯\\_(ツ)_/¯";
    let source: string | Sound[] = "";
    let volume = 100;
    let keys: number[] = [];

    if (typeof data["name"] === "string") name = data["name"];

    const sourceRes = tryGetValue(data, ["source"], v => typeof v === "string" || Array.isArray(v));
    if (sourceRes) {
        if (typeof sourceRes === "string") {
            source = sourceRes;
        } else {
            source = convertSounds(sourceRes as { [key: string]: unknown; }[], soundboardUuid, generateUuid);
        }
    } else {
        const pathRes = tryGetValue(data, ["path", "url"], v => typeof v === "string");
        if (pathRes) source = pathRes as string;
    }

    if (typeof data["volume"] === "number") volume = data["volume"];

    const keysRes = tryGetValue(data, ["keys", "shortcut"], v => Keys.isKeys(v));
    if (keysRes) keys = data["keys"] as number[];

    return new Sound(generateUuid(), name, source, volume, keys, soundboardUuid);
}

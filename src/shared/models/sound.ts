import Keys from "../keys";
import { tryGetValue } from "../sharedUtils";

// All functions must be static so instances can be passed between processes.
export default class Sound {
    soundboardUuid: string | null = null;

    // TODO: SubSounds
    constructor(
        public uuid: string,
        public name: string,
        public path: string,
        public volume: number,
        public keys: number[]) {
    }

    static compare(a: Sound, b: Sound): number {
        return a.name.localeCompare(b.name);
    }

    static equals(from: Sound, to: Sound): boolean {
        return from.uuid == to.uuid;
    }

    static toJSON(sound: Sound): { [key: string]: unknown } {
        return {
            name: sound.name,
            path: sound.path,
            volume: sound.volume,
            keys: sound.keys
        };
    }

    static copy(sound: Sound, uuid: string): Sound {
        return convertSound(this.toJSON(sound), uuid);
    }
}

export function convertSound(data: { [key: string]: unknown }, uuid: string): Sound {
    // Defaults
    let name = "¯\\_(ツ)_/¯";
    let path = "¯\\_(ツ)_/¯";
    let volume = 100;
    let keys: number[] = [];

    if (typeof data["name"] === "string") name = data["name"];

    const pathRes = tryGetValue(data, ["path", "url"], v => typeof v === "string");
    if (pathRes) path = pathRes as string;

    if (typeof data["volume"] === "number") volume = data["volume"];

    const keysRes = tryGetValue(data, ["keys", "shortcut"], v => Keys.isKeys(v));
    if (keysRes) keys = data["keys"] as number[];

    return new Sound(uuid, name, path, volume, keys);
}

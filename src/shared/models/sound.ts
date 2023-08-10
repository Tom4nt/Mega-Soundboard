import Keys from "../keys";
import { tryGetValue } from "../sharedUtils";

// All functions must be static so instances can be passed between processes.
export default class Sound {
    soundboardUuid: string | null = null;

    constructor(
        public uuid: string,
        public name: string,
        public path: string,
        public volume: number,
        public keys: number[]) {
    }

    static compare(a: Sound, b: Sound): number {
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
    }

    static equals(from: Sound, to: Sound): boolean {
        return from.uuid == to.uuid;
    }

    static toJSON(sound: Sound): object {
        return {
            name: sound.name,
            path: sound.path,
            volume: sound.volume,
            keys: sound.keys
        };
    }
}

export function convertSound(data: Map<string, unknown>, uuid: string): Sound {
    // Defaults
    let name = "¯\\_(ツ)_/¯";
    let path = "¯\\_(ツ)_/¯";
    let volume = 100;
    let keys: number[] = [];

    if (typeof data.get("name") === "string") name = data.get("name") as string;

    const pathRes = tryGetValue(data, ["path", "url"], v => typeof v === "string");
    if (pathRes) path = pathRes as string;

    if (typeof data.get("volume") === "number") volume = data.get("volume") as number;

    const keysRes = tryGetValue(data, ["keys", "shortcut"], v => Keys.isKeys(v));
    if (keysRes) keys = data.get("keys") as number[];

    return new Sound(uuid, name, path, volume, keys);
}

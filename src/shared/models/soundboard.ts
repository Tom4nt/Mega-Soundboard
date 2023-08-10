import Keys from "../keys";
import { Sound } from "../models";
import { objectToMap } from "../sharedUtils";
import { convertSound } from "./sound";

// All functions must be static so instances can be passed between processes.
export default class Soundboard {
    constructor(uuid: string);
    constructor(
        uuid: string,
        name: string,
        keys: number[],
        volume: number,
        linkedFolder: string | null,
        sounds: Sound[],
    );

    constructor(
        public uuid: string,
        public name: string = "Default",
        public keys: number[] = [],
        public volume: number = 100,
        public linkedFolder: string | null = null,
        public sounds: Sound[] = [],
    ) { }

    static equals(from: Soundboard, to: Soundboard): boolean {
        return from.uuid === to.uuid;
    }

    static toJSON(soundboard: Soundboard): object {
        return {
            name: soundboard.name,
            keys: soundboard.keys,
            volume: soundboard.volume,
            linkedFolder: soundboard.linkedFolder,
            sounds: soundboard.sounds.map(x => Sound.toJSON(x)),
        };
    }

    static getSoundWithPath(soundboard: Soundboard, path: string): Sound | undefined {
        return soundboard.sounds.find(x => x.path === path);
    }
}

export function convertSoundboard(data: { [key: string]: unknown }, generateUuid: () => string): Soundboard {
    let name = "¯\\_(ツ)_/¯";
    if (typeof data["name"] === "string") name = data["name"];

    let keys: number[] = [];
    if (Keys.isKeys(data["keys"])) keys = data["keys"];

    let volume = 100;
    if (typeof data["volume"] === "number") volume = data["volume"];

    let linkedFolder: string | null = null;
    if (typeof data["linkedFolder"] === "string") linkedFolder = data["linkedFolder"];

    const sbUuid = generateUuid();

    let sounds: Sound[] = [];
    if (Array.isArray(data["sounds"])) {
        sounds = convertSounds(data["sounds"], sbUuid, generateUuid);
    }

    return new Soundboard(sbUuid, name, keys, volume, linkedFolder, sounds);
}

export function convertSounds(data: unknown[], connectedSoundboardUuid: string, generateUuid: () => string): Sound[] {
    const sounds: Sound[] = [];
    data.forEach(item => {
        if (item && typeof item === "object") {
            const s = convertSound(objectToMap(item), generateUuid());
            s.soundboardUuid = connectedSoundboardUuid;
            sounds.push(s);
        }
    });
    return sounds;
}

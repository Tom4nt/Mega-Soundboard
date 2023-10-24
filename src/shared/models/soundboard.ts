import Keys from "../keys";
import { Sound } from "../models";
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

    static toJSON(soundboard: Soundboard): { [key: string]: unknown } {
        return {
            name: soundboard.name,
            keys: soundboard.keys,
            volume: soundboard.volume,
            linkedFolder: soundboard.linkedFolder,
            sounds: soundboard.sounds.map(x => Sound.toJSON(x)),
        };
    }

    static getSoundWithPath(soundboard: Soundboard, path: string): Sound | undefined {
        const inSoundboard = soundboard.sounds.find(x => x.source === path);
        if (inSoundboard) return inSoundboard;
        for (const sound of soundboard.sounds) {
            const subSound = Sound.getSoundWithPath(sound, path);
            if (subSound) return subSound;
        }
        return undefined;
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
        sounds = convertSounds(data["sounds"] as { [key: string]: unknown }[], sbUuid, generateUuid);
    }

    return new Soundboard(sbUuid, name, keys, volume, linkedFolder, sounds);
}

export function convertSounds(
    data: { [key: string]: unknown }[], connectedSoundboardUuid: string, generateUuid: () => string
): Sound[] {
    const sounds: Sound[] = [];
    data.forEach(item => {
        const s = convertSound(item, generateUuid, connectedSoundboardUuid);
        sounds.push(s);
    });
    return sounds;
}

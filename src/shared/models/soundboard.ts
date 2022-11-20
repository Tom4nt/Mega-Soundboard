import { Sound } from "../models";

// All functions must be static so instances can be passed between processes.
export default class Soundboard {
    constructor(uuid: string);
    constructor(uuid: string, name: string, keys: number[], volume: number, linkedFolder: string | null, sounds: Sound[]);
    constructor(
        public uuid: string,
        public name: string = "Default",
        public keys: number[] = [],
        public volume: number = 100,
        public linkedFolder: string | null = null,
        public sounds: Sound[] = []) {
    }

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

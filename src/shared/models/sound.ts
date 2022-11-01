import { Soundboard } from "../models";

// All functions must be static so instances can be passed between processes.
export default class Sound {
    private soundboard: Soundboard | null = null;
    get connectedSoundboard(): Soundboard | null { return this.soundboard; }

    constructor(
        public uuid: string,
        public name: string,
        public path: string,
        public volume: number,
        public keys: number[]) {
    }

    static equals(from: Sound, to: Sound): boolean {
        return from.uuid == to.uuid;
    }

    static connectToSoundboard(sound: Sound, soundboard: Soundboard): void {
        sound.soundboard = soundboard;
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

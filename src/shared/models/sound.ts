import { IEquatable } from "../interfaces";
import { Soundboard } from "../models";

type JSONSound = { name: string, path: string, volume: number, keys: number[] };

export default class Sound implements IEquatable<Sound> {
    private soundboard: Soundboard | null = null;
    get connectedSoundboard(): Soundboard | null { return this.soundboard; }

    mediaElements: HTMLMediaElement[];

    constructor(
        public name: string,
        public path: string,
        public volume: number,
        public keys: number[]) {

        this.mediaElements = [];
    }

    equals(to: Sound): boolean {
        return this.name === to.name &&
            this.path === to.path &&
            this.volume === to.volume &&
            this.keys === to.keys;
    }

    connectToSoundboard(soundboard: Soundboard): void {
        this.soundboard = soundboard;
    }

    toJSON(): JSONSound {
        return {
            name: this.name,
            path: this.path,
            volume: this.volume,
            keys: this.keys
        };
    }
}
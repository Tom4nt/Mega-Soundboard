import { IEquatable, JSONSerializable } from "../interfaces";
import { Soundboard } from "../models";

export default class Sound implements IEquatable<Sound>, JSONSerializable {
    private soundboard: Soundboard | null = null;
    get connectedSoundboard(): Soundboard | null { return this.soundboard; }

    constructor(
        public uuid: string,
        public name: string,
        public path: string,
        public volume: number,
        public keys: number[]) {
    }

    equals(to: Sound): boolean {
        return this.uuid == to.uuid;
    }

    connectToSoundboard(soundboard: Soundboard): void {
        this.soundboard = soundboard;
    }

    toJSON = (): object => {
        return {
            name: this.name,
            path: this.path,
            volume: this.volume,
            keys: this.keys
        };
    };
}
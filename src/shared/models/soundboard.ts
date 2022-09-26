import { Sound } from "../models";
import { IEquatable, JSONSerializable } from "../interfaces";

export default class Soundboard implements IEquatable<Soundboard>, JSONSerializable {
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

    equals = (to: Soundboard): boolean => {
        return this.name === to.name &&
            this.keys === to.keys &&
            this.volume === to.volume &&
            this.linkedFolder === to.linkedFolder;
    };

    addSound = (sound: Sound, index?: number): void => {
        if (!index) this.sounds.push(sound);
        else this.sounds.splice(index, 0, sound);
    };

    removeSound = (sound: Sound): void => {
        this.sounds.splice(this.sounds.indexOf(sound), 1);
    };

    toJSON = (): object => {
        return {
            name: this.name,
            keys: this.keys,
            volume: this.volume,
            linkedFolder: this.linkedFolder,
            sounds: this.sounds,
        };
    };
}
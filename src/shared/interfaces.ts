import { Sound, Soundboard } from "./models";

export type WindowState = "minimized" | "restored" | "maximized";

export type NonOptional<T> = {
    [P in keyof T]-?: Exclude<T[P], null>;
}

export interface IEquatable<T> {
    equals: (to: T) => boolean;
}

export interface JSONSerializable {
    toJSON: () => object;
}

export interface IDevice {
    id: string,
    volume: number
}

export interface SoundAddedArgs {
    sound: Sound;
    index?: number;
}

export interface SoundChangedArgs {
    sound: Sound,
    soundboard: Soundboard,
}

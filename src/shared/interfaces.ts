import { Playable } from "./models/playable";
import { Soundboard } from "./models/soundboard";

export type WindowState = "minimized" | "restored" | "maximized";
export type UpdaterState = "unknown" | "downloaded" | "downloading" | "upToDate";
export type Point = { x: number, y: number }

export type NonOptional<T> = {
    [P in keyof T]-?: Exclude<T[P], null>;
}

export type Optional<Type> = {
    [Property in keyof Type]+?: Type[Property];
};

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

export interface PlayableAddedArgs {
    playable: Playable,
    index?: number,
}

export interface SoundboardAddedArgs {
    soundboard: Soundboard,
    index?: number,
}

export interface KeyRecordingArgs {
    uuid: string,
    combination: number[],
}

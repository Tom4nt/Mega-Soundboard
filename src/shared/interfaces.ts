import { IPlayableData, ISoundboardData } from "./models/dataInterfaces";

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
	playable: IPlayableData,
	parentUuid: string,
	index?: number,
}

export interface SoundboardAddedArgs {
	soundboard: ISoundboardData,
	index?: number,
}

export interface ContainerSortedArgs {
	containerUuid: string,
	itemsUuids: string[],
}

export interface KeyRecordingArgs {
	uuid: string,
	combination: number[],
}

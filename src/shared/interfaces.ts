import { IBaseData, ISoundboardData, PlayData } from "./models/dataInterfaces";
import { uiSounds } from "./sharedUtils";

export type WindowState = "minimized" | "restored" | "maximized";
export type UpdaterState = "unknown" | "downloaded" | "downloading" | "upToDate";
export type Point = { x: number, y: number }
export type UISound = typeof uiSounds[number];

export type NonOptional<T> = {
	[P in keyof T]-?: Exclude<T[P], null>;
}

export type Optional<Type> = {
	[Property in keyof Type]+?: Type[Property];
};

export type CancelEventArgs = { cancel: boolean };

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
	playable: IBaseData,
	isPlaying: boolean,
}

export interface PlayablesAddedArgs {
	playables: PlayableAddedArgs[],
	parentUuid: string,
	index?: number,
}

export interface SoundboardAddedArgs {
	soundboard: ISoundboardData,
	index?: number,
	isCurrent: boolean,
}

export interface ContainerSortedArgs {
	containerUuid: string,
	itemsUuids: string[],
}

export interface KeyRecordingArgs {
	uuid: string,
	combination: number[],
}

export interface IPlayableArgs {
	data: IBaseData,
	isPlaying: boolean,
	isInLinkedSoundboard: boolean,
}

export interface IPlayArgs {
	data: PlayData,
	softError: boolean,
}

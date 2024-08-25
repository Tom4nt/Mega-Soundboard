import { IDevice, IPlayableArgs, Optional } from "../interfaces";
import { ActionName } from "../quickActions";

export interface IBaseData {
	uuid: string;
	name: string;
	volume: number;
	keys: number[];
	isGroup: boolean;
}

export interface ISoundData extends IBaseData {
	path: string;
}

export type GroupMode = "sequence" | "random" | "first" | "combine";
export interface IGroupData extends IBaseData {
	mode: GroupMode
}

export interface ISoundboardData extends IBaseData {
	linkedFolder: string | null;
	hasSounds: boolean;
}

/** The last uuid belongs to the deepest item. The first belongs to the root. */
export type UuidHierarchyData = string[];

export type Audio = {
	uuid: string,
	path: string,
	volume: number
}

export type PlayData = {
	sounds: Audio[],
	devices: readonly IDevice[],
	loops: boolean,
}

export interface ISettingsData {
	minToTray: boolean,
	mainDevice: string,
	secondaryDevice: string,
	mainDeviceVolume: number,
	secondaryDeviceVolume: number,
	selectedSoundboard: number,
	latestLogViewed: number,
	showSoundDragTutorial: boolean,
	soundsLocation: string,
	pttKeys: number[],
	processKeysOnRelease: boolean,
	windowSize: number[],
	windowPosition: number[],
	windowIsMaximized: boolean,
	quickActionKeys: Map<ActionName, number[]>,
	quickActionStates: Map<ActionName, boolean>,
}

export type OptionalSettings = Optional<ISettingsData>;

export interface IInitialContent {
	readonly settings: ISettingsData,
	readonly soundboards: ISoundboardData[],
	readonly initialPlayables: IPlayableArgs[],
	readonly shouldShowChangelog: boolean,
}

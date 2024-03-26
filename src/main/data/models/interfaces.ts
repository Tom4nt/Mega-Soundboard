import { IPlayableData } from "../../../shared/models/dataInterfaces";

export type JSONObject = { [key: string]: unknown };

export interface IContainer {
	getPlayables(): readonly IPlayable[];
	addPlayable(playable: IPlayable, index?: number): void;
	removePlayable(playable: IPlayable): void;
	containsPlayable(playable: IPlayable): boolean;
	findPlayablesRecursive(predicate: (p: IPlayable) => boolean): readonly IPlayable[];
	sortPlayables(): void;
}

export interface IPlayable {
	readonly isGroup: boolean;
	readonly isSound: boolean;
	readonly isSoundboard: boolean;
	readonly isContainer: boolean;
	readonly uuid: string;
	name: string;
	volume: number;
	keys: number[];
	parent: IPlayableContainer | null;
	getFinalVolume(): number;
	compare(other: IPlayable): number;
	getAudioPath(): string;
	getSavable(): JSONObject;
	copy(): IPlayable;
	edit(data: IPlayableData): void;
	asData(): IPlayableData;
}

export interface IPlayableContainer extends IPlayable, IContainer { }

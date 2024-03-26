export interface IPlayableData {
	uuid: string;
	name: string;
	volume: number;
	keys: number[];
	isGroup: boolean;
}

export interface ISoundData extends IPlayableData {
	path: string;
}

export type GroupMode = "sequence" | "random" | "first";
export interface IGroupData extends IPlayableData {
	mode: GroupMode
}

export interface ISoundboardData extends IPlayableData {
	linkedFolder: string | null;
	hasSounds: boolean;
}

/** The last uuid belongs to the deepest item. The first belongs to the root. */
export type UuidHierarchy = string[];

export type PlayData = {
	mainUuid: string,
	hierarchy: UuidHierarchy,
	path: string,
	volume: number,
}

import { NonOptional, UpdaterState } from "./interfaces";
import { OptionalSettings, Settings } from "./models";
import { IPlayableData, ISoundData, ISoundboardData, PlayData } from "./models/dataInterfaces";
import { ActionName } from "./quickActions";

class ConcreteActions {
	minimize: (() => void) | null = null;
	toggleMaximizedState: (() => void) | null = null;
	close: (() => void) | null = null;

	zoomIncrement: ((value: number) => void) | null = null;
	zoomSet: ((val: number) => void) | null = null;
	zoomGet: (() => Promise<number>) | null = null;
	zoomReset: (() => void) | null = null;

	addSounds: ((sounds: ISoundData[], destinationId: string | null, moveFile: boolean, startIndex?: number) => Promise<string>) | null = null;
	editPlayable: ((data: IPlayableData) => void) | null = null;
	movePlayable: ((uuid: string, destinationId: string | null, destinationIndex: number) => Promise<string>) | null = null;
	copyPlayable: ((uuid: string, destinationId: string | null, destinationIndex: number) => Promise<string>) | null = null;
	deletePlayable: ((uuid: string) => void) | null = null;
	getNewSoundsFromPaths: ((paths: string[]) => Promise<ISoundData[]>) | null = null;
	getValidSoundPaths: ((paths: string[]) => Promise<string[]>) | null = null;
	getPlayableRoot: ((uuid: string) => Promise<ISoundboardData | undefined>) | null = null;
	getPlayable: ((uuid: string) => Promise<IPlayableData | undefined>) | null = null;
	getContainerItems: ((uuid: string) => Promise<IPlayableData[]>) | null = null;
	getPlayData: ((uuid: string) => Promise<PlayData>) | null = null;
	stopAllSounds: ((containerUuid: string) => Promise<void>) | null = null;

	getSoundboard: ((uuid: string) => Promise<ISoundboardData>) | null = null;
	getNewSoundboard: (() => Promise<ISoundboardData>) | null = null;
	addSoundboard: ((soundboard: ISoundboardData) => void) | null = null;
	moveSoundboard: ((uuid: string, destinationIndex: number) => void) | null = null;
	deleteSoundboard: ((uuid: string) => void) | null = null;
	editSoundboard: ((soundboard: ISoundboardData) => void) | null = null;
	setCurrentSoundboard: ((uuid: string) => void) | null = null;
	getCurrentSoundboard: (() => Promise<ISoundboardData | undefined>) | null = null;
	getSoundboards: (() => Promise<ISoundboardData[]>) | null = null;
	getInitialSoundboardIndex: (() => Promise<number>) | null = null;
	sortSoundboard: ((uuid: string) => Promise<void>) | null = null;

	flagChangelogViewed: (() => void) | null = null;
	installUpdate: (() => void) | null = null;
	checkUpdate: (() => Promise<UpdaterState>) | null = null;

	setMainDevice: ((uuid?: string, volume?: number) => void) | null = null;
	setSecondaryDevice: ((uuid?: string | null, volume?: number) => void) | null = null;

	getSettings: (() => Promise<Settings>) | null = null;
	saveSettings: ((settings: OptionalSettings) => void) | null = null;
	shouldShowChangelog: (() => Promise<boolean>) | null = null;
	executeQuickAction: ((name: ActionName) => Promise<void>) | null = null;

	openRepo: (() => void) | null = null;
	openFeedback: (() => void) | null = null;

	browseSounds: (() => Promise<string[]>) | null = null;
	browseFolder: (() => Promise<string | undefined>) | null = null;
	getNameFromPath: ((path: string) => Promise<string>) | null = null;
	getDefaultMovePath: (() => Promise<string>) | null = null;
	parsePath: ((path: string) => Promise<string | null>) | null = null;

	startKeyRecordingSession: (() => Promise<string>) | null = null;
	stopKeyRecordingSession: ((uuid: string) => void) | null = null;
	holdPTT: (() => Promise<string>) | null = null;
	releasePTT: ((handle: string) => Promise<void>) | null = null;

	getNewsHtml: (() => Promise<string>) | null = null;
	getVersion: (() => Promise<string>) | null = null;
}

export type Actions = NonOptional<ConcreteActions>;
export const actionsKeys = Object.keys(new ConcreteActions) as (keyof Actions)[];

import { Settings } from "../models";
import { IPlayableData, ISoundboardData } from "./dataInterfaces";

export default class InitialContent {
	constructor(
		readonly settings: Settings,
		readonly soundboards: ISoundboardData[],
		readonly initialPlayables: IPlayableData[],
		readonly shouldShowChangelog: boolean,
	) { }
}

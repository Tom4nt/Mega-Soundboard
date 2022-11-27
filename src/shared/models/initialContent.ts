import { Settings, Soundboard } from "../models";

export default class InitialContent {
    constructor(
        readonly settings: Settings,
        readonly soundboards: Soundboard[],
        readonly shouldShowChangelog: boolean,
    ) { }
}

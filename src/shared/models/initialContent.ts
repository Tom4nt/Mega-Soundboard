import { Settings } from "../models";
import { Soundboard } from "./soundboard";

export default class InitialContent {
    constructor(
        readonly settings: Settings,
        readonly soundboards: Soundboard[],
        readonly shouldShowChangelog: boolean,
    ) { }
}

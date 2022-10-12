import { Settings } from "../shared/models";

export default class SettingsCache {
    constructor(public readonly settings: Settings) { }
}
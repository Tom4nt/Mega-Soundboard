import { OptionalSettings, Settings } from "../../shared/models";
import EventSender from "../eventSender";
import MS from "../ms";
import DataAccess from "./dataAccess";

export default class SettingsCache {
    constructor(public readonly settings: Settings) { }

    async setMainDevice(id?: string, volume?: number): Promise<void> {
        if (id !== undefined) this.settings.mainDevice = id;
        if (volume !== undefined) this.settings.mainDeviceVolume = volume;
        EventSender.send("onSettingsChanged", this.settings);
        await DataAccess.saveSettings(this.settings);
    }

    async setSecondaryDevice(id?: string | null, volume?: number): Promise<void> {
        if (id !== undefined) this.settings.secondaryDevice = id ?? "";
        if (volume !== undefined) this.settings.secondaryDeviceVolume = volume;
        EventSender.send("onSettingsChanged", this.settings);
        await DataAccess.saveSettings(this.settings);
    }

    async save(values?: OptionalSettings): Promise<void> {
        this.preSave(values);
        await DataAccess.saveSettings(this.settings);
    }

    /** Used when exiting the app due to an electron bug: https://github.com/electron/electron/issues/34311#issuecomment-1324283551 */
    saveSync(values?: OptionalSettings): void {
        this.preSave(values);
        DataAccess.saveSettingsSync(this.settings);
    }

    shouldShowChangelog(): boolean {
        return this.settings.latestLogViewed < MS.latestWithLog;
    }

    // ----

    /** Just to prevent repetition between sync and async saving methods. */
    private preSave(values?: OptionalSettings): void {
        let key: keyof Settings;
        if (values) {
            for (key in values) {
                const proposed = values[key];
                if (proposed !== undefined)
                    this.setSettingsValue(key, proposed);
            }
        }
        EventSender.send("onSettingsChanged", this.settings);
    }

    private setSettingsValue<T extends keyof Settings>(key: T, val: Settings[T]): void {
        this.settings[key] = val;
    }
}

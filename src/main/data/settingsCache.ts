import { OptionalSettings, Settings } from "../../shared/models";
import EventSender from "../eventSender";
import MS from "../ms";
import DataAccess from "./dataAccess";

export default class SettingsCache {
    constructor(public readonly settings: Settings) { }

    async setMainDevice(id?: string, volume?: number): Promise<void> {
        if (id !== undefined) this.settings.mainDevice = id;
        if (volume !== undefined) this.settings.mainDeviceVolume = volume;
        await DataAccess.saveSettings(this.settings);
        EventSender.send("onDevicesChanged", this.settings);
    }

    async setSecondaryDevice(id?: string | null, volume?: number): Promise<void> {
        if (id !== undefined) this.settings.secondaryDevice = id;
        if (volume !== undefined) this.settings.secondaryDeviceVolume = volume;
        await DataAccess.saveSettings(this.settings);
        EventSender.send("onDevicesChanged", this.settings);
    }

    async setCurrentSoundboard(index: number): Promise<void> {
        this.settings.selectedSoundboard = index;
        await DataAccess.saveSettings(this.settings);
    }

    async save(values: OptionalSettings): Promise<void> {
        let key: keyof Settings;
        for (key in values) {
            const proposed = values[key];
            if (proposed)
                this.setSettingsValue(key, proposed);
        }
        await DataAccess.saveSettings(this.settings);
    }

    shouldShowChangelog(): boolean {
        return this.settings.latestLogViewed < MS.latestWithLog;
    }

    // ----

    private setSettingsValue<T extends keyof Settings>(key: T, val: Settings[T]): void {
        this.settings[key] = val;
    }
}

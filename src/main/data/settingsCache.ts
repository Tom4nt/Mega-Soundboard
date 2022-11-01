import { OptionalSettings, Settings } from "../../shared/models";
import MS from "../ms";
import DataAccess from "./dataAccess";

export default class SettingsCache {
    constructor(public readonly settings: Settings) { }

    async setDeviceId(index: number, id: string): Promise<void> {
        if (index == 0) this.settings.mainDevice = id;
        if (index == 1) this.settings.secondaryDevice = id;
        await DataAccess.saveSettings(this.settings);
    }

    async setDeviceVolume(index: number, volume: number): Promise<void> {
        if (index == 0) this.settings.mainDeviceVolume = volume;
        if (index == 1) this.settings.secondaryDeviceVolume = volume;
        await DataAccess.saveSettings(this.settings);
    }

    getCurrentDevices(): string[] {
        const devices = [this.settings.mainDevice];
        if (this.settings.secondaryDevice) devices.push(this.settings.secondaryDevice);
        return devices;
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

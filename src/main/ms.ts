import DataAccess from "./dataAccess";
import IPCEvents, { events } from "./ipcEvents";
import SettingsCache from "./settingsCache";
import SoundboardsCache from "./soundboardsCache";
import TrayManager from "./trayManager";
import WindowManager from "./windowManager";

/** Represents the app instance in the main process. */
export default class MS {
    isKeybindsEnabled = false;
    isOverlapEnabled = false;
    isMinToTrayEnabled = false;

    isRecordingKey = false;
    modalsOpen = 0;

    static readonly latestWithLog = 3; // Increments on every version that should display the changelog.

    private static _instance?: MS;
    public static get instance(): MS {
        if (!MS._instance) throw Error("MS Singleton was not initialized");
        return MS._instance;
    }
    private static set instance(value: MS) {
        MS._instance = value;
    }

    constructor(
        public readonly windowManager: WindowManager,
        public readonly trayManager: TrayManager,
        public readonly soundboardsCache: SoundboardsCache,
        public readonly settingsCache: SettingsCache,
    ) {
        MS.instance = this;
    }

    toggleKeybindsState(): void {
        this.isKeybindsEnabled = !this.isKeybindsEnabled;
        this.trayManager.update();
        IPCEvents.send(events.keybindsStateChanged, this.isKeybindsEnabled);
    }

    toggleOverlapSoundsState(): void {
        this.isOverlapEnabled = !this.isOverlapEnabled;
        this.trayManager.update();
        IPCEvents.send(events.overlapSoundsStateChanged, this.isOverlapEnabled);
    }

    setMinToTray(state: boolean): void {
        this.isMinToTrayEnabled = state;
        IPCEvents.send(events.minToTrayChanged, state);
    }

    flagChangelogViewed(): void {
        this.settingsCache.settings.latestLogViewed = MS.latestWithLog;
        void DataAccess.saveSettings(this.settingsCache.settings);
    }
}

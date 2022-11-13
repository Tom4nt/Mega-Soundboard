import DataAccess from "./data/dataAccess";
import EventSender from "./eventSender";
import SettingsCache from "./data/settingsCache";
import SoundboardsCache from "./data/soundboardsCache";
import TrayManager from "./managers/trayManager";
import WindowManager from "./managers/windowManager";
import FolderWatcher from "./folderWatcher";
import SoundUtils from "./utils/soundUtils";
import { Soundboard } from "../shared/models";

/** Represents the app instance in the main process. */
export default class MS {
    isKeybindsEnabled = false;
    isOverlapEnabled = false;
    isMinToTrayEnabled = false;

    private currentSoundboardWatcher: FolderWatcher | null = null;

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
        EventSender.send("onKeybindsStateChanged", this.isKeybindsEnabled);
    }

    toggleOverlapSoundsState(): void {
        this.isOverlapEnabled = !this.isOverlapEnabled;
        this.trayManager.update();
        EventSender.send("onOverlapSoundsStateChanged", this.isOverlapEnabled);
    }

    setMinToTray(state: boolean): void {
        this.isMinToTrayEnabled = state;
        EventSender.send("onMinToTrayChanged", state);
    }

    flagChangelogViewed(): void {
        this.settingsCache.settings.latestLogViewed = MS.latestWithLog;
        void DataAccess.saveSettings(this.settingsCache.settings);
    }

    async setCurrentSoundboard(soundboard: Soundboard): Promise<void> {
        const index = this.soundboardsCache.findSoundboardIndex(soundboard.uuid);
        await this.settingsCache.setCurrentSoundboard(index);

        if (!soundboard.linkedFolder) {
            this.currentSoundboardWatcher = null;
            EventSender.send("onCurrentSoundboardChanged", soundboard);
            return;
        }

        const watcher = new FolderWatcher(soundboard.linkedFolder);
        if (this.currentSoundboardWatcher) this.currentSoundboardWatcher.stop();
        this.currentSoundboardWatcher = watcher;

        watcher.onSoundAdded.addHandler(p => {
            const sound = SoundUtils.getNewSoundsFromPaths([p])[0];
            EventSender.send("onSoundAdded", { sound: sound });
        });

        watcher.onSoundRemoved.addHandler(p => {
            const sound = Soundboard.getSoundWithPath(soundboard, p);
            if (sound) EventSender.send("onSoundRemoved", sound);
        });

        await watcher.syncSounds(soundboard);
        EventSender.send("onCurrentSoundboardChanged", soundboard);
        await watcher.start();
    }
}

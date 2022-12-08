import DataAccess from "./data/dataAccess";
import EventSender from "./eventSender";
import SettingsCache from "./data/settingsCache";
import SoundboardsCache from "./data/soundboardsCache";
import TrayManager from "./managers/trayManager";
import WindowManager from "./managers/windowManager";
import FolderWatcher from "./folderWatcher";
import SoundUtils from "./utils/soundUtils";
import { Soundboard } from "../shared/models";
import KeybindManager from "./managers/keybindManager";

/** Represents the app instance in the main process. */
export default class MS {
    isKeybindsEnabled = false;
    isOverlapEnabled = false;

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
        public readonly keybindManager: KeybindManager,
    ) {
        MS.instance = this;
        this.isKeybindsEnabled = settingsCache.settings.enableKeybinds;
        this.isOverlapEnabled = settingsCache.settings.overlapSounds;
    }

    async toggleKeybindsState(): Promise<void> {
        this.isKeybindsEnabled = !this.isKeybindsEnabled;
        this.trayManager.update(this.isKeybindsEnabled, this.isOverlapEnabled);
        EventSender.send("onKeybindsStateChanged", this.isKeybindsEnabled);
        await this.settingsCache.save({ enableKeybinds: this.isKeybindsEnabled });
    }

    async toggleOverlapSoundsState(): Promise<void> {
        this.isOverlapEnabled = !this.isOverlapEnabled;
        this.trayManager.update(this.isKeybindsEnabled, this.isOverlapEnabled);
        EventSender.send("onOverlapSoundsStateChanged", this.isOverlapEnabled);
        await this.settingsCache.save({ overlapSounds: this.isOverlapEnabled });
    }

    flagChangelogViewed(): void {
        this.settingsCache.settings.latestLogViewed = MS.latestWithLog;
        void DataAccess.saveSettings(this.settingsCache.settings);
    }

    async setCurrentSoundboard(soundboard: Soundboard): Promise<void> {
        const index = this.soundboardsCache.findSoundboardIndex(soundboard.uuid);
        this.settingsCache.setCurrentSoundboard(index);

        if (this.currentSoundboardWatcher) this.currentSoundboardWatcher.stop();
        this.currentSoundboardWatcher = null;

        if (!soundboard.linkedFolder) {
            EventSender.send("onCurrentSoundboardChanged", soundboard);
            return;
        }

        const watcher = new FolderWatcher(soundboard.linkedFolder);
        this.currentSoundboardWatcher = watcher;

        watcher.onSoundAdded.addHandler(p => {
            const sound = SoundUtils.getNewSoundsFromPaths([p])[0];
            void MS.instance.soundboardsCache.addSounds([sound], soundboard.uuid, false);
        });

        watcher.onSoundRemoved.addHandler(p => {
            const sound = Soundboard.getSoundWithPath(soundboard, p);
            if (sound) void MS.instance.soundboardsCache.removeSound(sound.uuid);
        });

        await watcher.syncSounds(soundboard);
        EventSender.send("onCurrentSoundboardChanged", soundboard);
        await watcher.start();
    }
}

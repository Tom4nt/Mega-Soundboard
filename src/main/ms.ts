import DataAccess from "./data/dataAccess";
import EventSender from "./eventSender";
import SettingsCache from "./data/settingsCache";
import SoundboardsCache from "./data/soundboardsCache";
import TrayManager from "./managers/trayManager";
import WindowManager from "./managers/windowManager";
import FolderWatcher from "./folderWatcher";
import SoundUtils from "./utils/soundUtils";
import { Settings, Soundboard } from "../shared/models";
import KeybindManager from "./managers/keybindManager";
import Keys from "../shared/keys";
import { app } from "electron";
import path = require("path");
import SoundboardUtils from "./utils/soundboardUtils";
import { actionBindings } from "./quickActionBindings";
import { isAction } from "../shared/quickActions";

/** Represents the app instance in the main process. */
export default class MS {
    private currentSoundboardWatcher: FolderWatcher | null = null;

    static readonly defaultSoundsPath = path.join(app.getPath("appData"), "MegaSoundboard/Sounds");
    static readonly latestWithLog = 4; // Increments on every version that should display the changelog.

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
        keybindManager.onKeybindPressed.addHandler(async kb => {
            const s = this.settingsCache.settings;
            const keybindsEnabled = Settings.getActionState(s, "toggleKeybinds");
            if (keybindsEnabled) {
                for (const k in s.quickActionKeys) {
                    const keybind = s.quickActionKeys[k];
                    if (Keys.equals(kb, keybind) && isAction(k)) {
                        void actionBindings[k](k as never);
                    }
                }
            } else {
                if (Keys.equals(kb, Settings.getActionKeys(s, "toggleKeybinds"))) {
                    void actionBindings["toggleKeybinds"]("toggleKeybinds");
                }
            }
        });
    }

    flagChangelogViewed(): void {
        this.settingsCache.settings.latestLogViewed = MS.latestWithLog;
        void DataAccess.saveSettings(this.settingsCache.settings);
    }

    static stopAllSounds(): void {
        EventSender.send("onStopAllSounds");
    }

    async setCurrentSoundboard(soundboard: Soundboard): Promise<void> {
        const index = this.soundboardsCache.findSoundboardIndex(soundboard.uuid);
        this.settingsCache.settings.selectedSoundboard = index;

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

        try {
            await SoundboardUtils.syncSounds(soundboard);
            await watcher.start();
        } catch (error) {
            // The folder is invalid and the soundboard will be shown as empty.
        }
        EventSender.send("onCurrentSoundboardChanged", soundboard);
    }
}

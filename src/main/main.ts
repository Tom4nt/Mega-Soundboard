import { app, dialog } from "electron";
import MS from "./ms";
import WindowManager from "./managers/windowManager";
import TrayManager from "./managers/trayManager";
import SoundboardsCache from "./data/soundboardsCache";
import SettingsCache from "./data/settingsCache";
import DataAccess from "./data/dataAccess";
import InitialContent from "../shared/models/initialContent";
import KeybindManager from "./managers/keybindManager";
import { Settings } from "../shared/models";
import IPCHandler from "./ipcHandler";
import Updater from "./updater";

app.setAppUserModelId("com.tom4nt.megasoundboard");
app.commandLine.appendSwitch("force-color-profile", "srgb");
app.commandLine.appendSwitch("disable-features", "ColorCorrectRendering");
app.commandLine.appendSwitch("disable-color-correct-rendering");
app.commandLine.appendSwitch("disable-features", "HardwareMediaKeyHandling");

let windowManager: WindowManager | null = null;

// Prevent other instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.exit(0);
} else {
    app.on("second-instance", () => {
        windowManager?.mainWindow.show();
        windowManager?.mainWindow.focus();
    });
}

void Updater.instance.check();
IPCHandler.register();

app.on("ready", function () {
    void init().catch(e => {
        dialog.showErrorBox("Error",
            "An error has occurred while trying to load the app. This may cause unexpected behaviours. " + String(e));
    });
});

async function init(): Promise<void> {
    const soundboardsCache = new SoundboardsCache(await DataAccess.getSoundboardsFromSaveFile());
    const settingsCache = new SettingsCache(await DataAccess.getSettingsFromSaveFile());

    const settings = settingsCache.settings;
    windowManager = new WindowManager(settings.windowSize, settings.windowPosition, settings.windowIsMaximized);
    await windowManager.showLoadingWindow();
    const s = settingsCache.settings;
    const keybindManager = new KeybindManager();
    keybindManager.raiseExternal = Settings.getActionState(s, "toggleKeybinds");
    const trayManager = TrayManager.createTray(windowManager.mainWindow, s.quickActionStates);

    new MS(windowManager, trayManager, soundboardsCache, settingsCache, keybindManager);
    await selectInitialSoundboard(soundboardsCache, settingsCache.settings.selectedSoundboard);

    windowManager.loadingWindow.close();
    await windowManager.showMainWindow(() => new InitialContent(
        settingsCache.settings,
        soundboardsCache.soundboards,
        settingsCache.shouldShowChangelog()
    ));
}

async function selectInitialSoundboard(soundboardsCache: SoundboardsCache, selectedIndex: number): Promise<void> {
    let soundboard = soundboardsCache.soundboards[selectedIndex];
    if (!soundboard) soundboard = soundboardsCache.soundboards[0]!;
    await MS.instance.setCurrentSoundboard(soundboard);
}

app.on("before-quit", () => {
    KeybindManager.stopUIOhook();
    MS.instance.settingsCache.saveSync();
});

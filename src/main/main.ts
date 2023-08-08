import { app, dialog } from "electron";
import { autoUpdater } from "electron-updater";
import MS from "./ms";
import WindowManager from "./managers/windowManager";
import TrayManager from "./managers/trayManager";
import EventSender from "./eventSender";
import SoundboardsCache from "./data/soundboardsCache";
import SettingsCache from "./data/settingsCache";
import DataAccess from "./data/dataAccess";
import InitialContent from "../shared/models/initialContent";
import KeybindManager from "./managers/keybindManager";
import { Settings } from "../shared/models";
import IPCHandler from "./ipcHandler";

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
    app.on("second-instance", (_e, args) => {
        console.log(args[args.length - 1].toString());
        windowManager?.mainWindow.show();
        windowManager?.mainWindow.focus();
    });
}

void autoUpdater.checkForUpdates();
autoUpdater.on("update-available", () => EventSender.send("onUpdateAvailable"));
autoUpdater.on("download-progress", progress => EventSender.send("onUpdateProgress", progress.percent));
autoUpdater.on("update-downloaded", () => EventSender.send("onUpdateReady"));
setInterval(() => {
    void autoUpdater.checkForUpdates();
}, 5 * 60 * 1000);

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
    await MS.instance.setCurrentSoundboard(soundboardsCache.soundboards[settingsCache.settings.selectedSoundboard]);

    windowManager.loadingWindow.close();
    await windowManager.showMainWindow(() => new InitialContent(
        settingsCache.settings,
        soundboardsCache.soundboards,
        settingsCache.shouldShowChangelog()
    ));
}

app.on("before-quit", () => {
    KeybindManager.stopUIOhook();
    MS.instance.settingsCache.saveSync();
});

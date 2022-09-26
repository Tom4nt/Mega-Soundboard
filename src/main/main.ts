import { app } from "electron";
import { autoUpdater } from "electron-updater";
import { fromMain } from "../shared/ipcChannels";
// import ioHook = require("iohook");
import "electron-reload";
import MS from "./ms";
import WindowManager from "./windowManager";
import TrayManager from "./trayManager";
import IPCHandler from "./ipcHandler";

app.setAppUserModelId("com.tom4nt.megasoundboard");
app.commandLine.appendSwitch("force-color-profile", "srgb");
app.commandLine.appendSwitch("disable-features", "ColorCorrectRendering");
app.commandLine.appendSwitch("disable-color-correct-rendering");
app.commandLine.appendSwitch("disable-features", "HardwareMediaKeyHandling");

// Prevent other instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.exit(0);
} else {
    app.on("second-instance", (_e, args) => {
        console.log(args[args.length - 1].toString());
        MS.instance.windowManager.window.show();
        MS.instance.windowManager.window.focus();
    });
}

void autoUpdater.checkForUpdates();
autoUpdater.on("update-available", () => MS.instance.windowManager.window.webContents.send(fromMain.updateAvailable));
autoUpdater.on("download-progress", progress => MS.instance.windowManager.window.webContents.send(fromMain.updateProgress, progress.percent));
autoUpdater.on("update-downloaded", () => MS.instance.windowManager.window.webContents.send(fromMain.updateReady));
setInterval(() => {
    void autoUpdater.checkForUpdates();
}, 300000); //5 minutes

// type KeyEvent = { keycode: number };

// ioHook.start();
// ioHook.on("keydown", (event: KeyEvent) => {
//     win.webContents.send("key.down", event.keycode);
// });
// ioHook.on("keyup", (event: KeyEvent) => {
//     win.webContents.send("key.up", event.keycode);
// });

IPCHandler.init();

app.on("ready", function () {
    void init();
});

function init(): void {
    const winManager = WindowManager.createWindow();
    const trayManager = TrayManager.createTray(winManager.window);
    new MS(winManager, trayManager);
}

app.on("will-quit", function () {
    // ioHook.unregisterAllShortcuts();
    // ioHook.stop();
});
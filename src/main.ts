import { app, BrowserWindow, Menu, MenuItem, ipcMain, Tray, dialog, shell } from "electron";
import { autoUpdater } from "electron-updater";
import ioHook = require("iohook");
import "electron-reload";

//#region CONSTS

const iconWhitePath = __dirname + "\\app\\res\\icon_white.ico";
const iconPausedPath = __dirname + "\\app\\res\\icon_dot.ico";
const MainMenu = new Menu();

enum TrayItem {
    EnableKybinds = "trayIcon:enableKeybinds",
    EnableOverlapSounds = "trayIcon:enableOverlapSounds"
}

//#endregion

let tray: Tray;
let trayMenu: Electron.Menu;
let minToTray = false;
let win: BrowserWindow;
let isKeybindsEnabled = false;
let isOverlapSoundsEnabled = false;

// app.enableSandbox(); // TODO: Enable Sandbox
app.setAppUserModelId("com.tom4nt.megasoundboard");
app.commandLine.appendSwitch("force-color-profile", "srgb");
app.commandLine.appendSwitch("disable-features", "ColorCorrectRendering");
app.commandLine.appendSwitch("disable-color-correct-rendering");
app.commandLine.appendSwitch("disable-features", "HardwareMediaKeyHandling");

//#region Prevent other instances

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.exit(0);
} else {
    app.on("second-instance", (_e, args) => {
        console.log(args[args.length - 1].toString());
        if (win) {
            win.show();
            win.focus();
        }
    });
}

//#endregion

//#region Updates

void autoUpdater.checkForUpdates();
autoUpdater.on("update-available", () => win.webContents.send("update.available"));
autoUpdater.on("download-progress", progress => win.webContents.send("update.progress", progress.percent));
autoUpdater.on("update-downloaded", () => win.webContents.send("update.ready"));
setInterval(() => {
    void autoUpdater.checkForUpdates();
}, 300000); //5 minutes

//#endregion

//#region Init OS things
async function createWindow(): Promise<void> {
    win = new BrowserWindow({
        show: false,
        width: 850,
        height: 600,
        minWidth: 650,
        minHeight: 420,
        webPreferences: {
            nodeIntegration: true,
            // enableRemoteModule: false,
            contextIsolation: false,
            spellcheck: false
        },
        frame: false,
        title: "Mega Soundboard",
        backgroundColor: "#1f1f24"
    });

    win.webContents.on("will-navigate", (e, url) => {
        e.preventDefault();
        void shell.openExternal(url);
    });

    win.on("ready-to-show", () => {
        win.show();
    });

    win.on("minimize", function () {
        if (minToTray) {
            win.hide();
        }
    });

    win.on("maximize", function () {
        win.webContents.send("win.maximize");
    });

    win.on("unmaximize", function () {
        win.webContents.send("win.unmaximize");
    });

    win.on("focus", () => {
        win.webContents.send("win.focus");
    });

    win.on("blur", () => {
        win.webContents.send("win.blur");
    });

    win.setMenu(MainMenu);

    await win.loadFile("app/index.html");
}

function createTray(): void {
    tray = new Tray(iconWhitePath);
    tray.setToolTip("Mega Soundboard");
    trayMenu = Menu.buildFromTemplate([{
        id: TrayItem.EnableKybinds,
        label: "Enable keybinds",
        type: "checkbox",
        click: (): void => {
            sendkeybindsEnabledState(!isKeybindsEnabled);
            updateIcon(isKeybindsEnabled);
        }
    },
    {
        id: TrayItem.EnableOverlapSounds,
        label: "Overlap sounds",
        type: "checkbox",
        click: (): void => {
            sendOverlapSoundsState(!isOverlapSoundsEnabled);
        }
    },
    { type: "separator" },
    {
        label: "Show",
        click: (): void => {
            win.show();
        }
    },
    {
        label: "Close",
        click: (): void => {
            app.quit();
        }
    }
    ]);
    tray.setContextMenu(trayMenu);
    tray.on("click", function () {
        win.show();
    });
}
//#endregion

//#region Functions

function sendkeybindsEnabledState(state: boolean): void {
    win.webContents.send("settings.enableKeybinds", state);
}

function sendOverlapSoundsState(state: boolean): void {
    win.webContents.send("settings.overlapSounds", state);
}

function updateIcon(enableKeybinds: boolean): void {
    if (enableKeybinds) {
        tray.setImage(iconWhitePath);
        tray.setToolTip("Mega Soundboard");
    } else {
        tray.setImage(iconPausedPath);
        tray.setToolTip("Mega Soundboard (Keybinds disabled)");
    }
}

//#endregion

//#region Keybind Events

type KeyEvent = { keycode: number };

ioHook.start();
ioHook.on("keydown", (event: KeyEvent) => {
    win.webContents.send("key.down", event.keycode);
});
ioHook.on("keyup", (event: KeyEvent) => {
    win.webContents.send("key.up", event.keycode);
});

//#endregion

//#region Renderer Events

//#region win

ipcMain.on("win.close", function () {
    app.quit();
});

ipcMain.on("win.size", function () {
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

ipcMain.on("win.min", function () {
    //if (toTray) win.hide();
    /*else*/
    win.minimize();
});

ipcMain.on("win.minToTray", (_e, val: boolean) => {
    minToTray = val;
});

//#endregion

ipcMain.handle("key.register", (_e, keycode: string[]) => {
    const id = ioHook.registerShortcut(keycode, () => {
        win.webContents.send("key.perform", id);
    });
    return id;
});

ipcMain.handle("key.unregister", (_e, id: number) => {
    ioHook.unregisterShortcut(id);
});

ipcMain.handle("version", () => {
    return app.getVersion();
});

ipcMain.handle("open.url", (e, url: string) => {
    void shell.openExternal(url);
});

ipcMain.on("get.savePath", (e) => {
    e.returnValue = app.getPath("appData") + "\\MegaSoundboard";
});

ipcMain.handle("file.browse", async (e, multiple, typeName: string, extensions: string[]) => {
    return dialog.showOpenDialog({
        properties: multiple ? ["openFile", "multiSelections"] : ["openFile"],
        filters: [
            {
                name: typeName,
                extensions: extensions
            }
        ]
    }).then((r) => {
        return r.filePaths;
    });
});

ipcMain.handle("folder.browse", async () => {
    return dialog.showOpenDialog({
        properties: ["openDirectory"]
    }).then((r) => {
        return r.filePaths[0];
    });
});

ipcMain.handle("sound.browse", async (e, multiple) => {
    return dialog.showOpenDialog({
        properties: multiple ? ["openFile", "multiSelections"] : ["openFile"],
        filters: [
            { name: "Audio files", extensions: ["mp3", "wav", "ogg"] }
        ]
    }).then((r) => {
        if (r.filePaths && r.filePaths[0]) {
            return multiple ? r.filePaths : r.filePaths[0];
        } else {
            return null;
        }
    });
});

ipcMain.on("update.perform", function () {
    autoUpdater.quitAndInstall();
});

ipcMain.on("settings.enableKeybinds", function (_e, state: boolean) {
    isKeybindsEnabled = state;
    const menuItem = trayMenu.getMenuItemById(TrayItem.EnableKybinds);
    if (menuItem) menuItem.checked = state;
    updateIcon(state);
});

ipcMain.on("settings.overlapSounds", function (_e, state: boolean) {
    isOverlapSoundsEnabled = state;
    const menuItem = trayMenu.getMenuItemById(TrayItem.EnableOverlapSounds);
    if (menuItem) menuItem.checked = state;
});

//#endregion

//#region App events

app.on("ready", function () {
    void createWindow();
    createTray();
});

app.on("will-quit", function () {
    ioHook.unregisterAllShortcuts();
    ioHook.stop();
});

//#endregion

//#region --- DEBUG ---

MainMenu.append(new MenuItem({
    label: "Dev Tools",
    accelerator: "Ctrl+Shift+I",
    click: (_item, window): void => { window?.webContents.toggleDevTools(); }
}));

MainMenu.append(new MenuItem({
    accelerator: "F5",
    click: (_item, window): void => {
        ioHook.unregisterAllShortcuts();
        window?.reload();
    }
}));

//#endregion
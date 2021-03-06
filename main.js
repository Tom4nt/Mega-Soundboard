const { app, BrowserWindow, Menu, MenuItem, ipcMain, Tray, dialog, shell } = require("electron");
const ioHook = require("iohook");
const { autoUpdater } = require("electron-updater");
require('electron-reload')(__dirname);

const TRAY_KEYBINDS = "keybindsEnabled"
const TRAY_OVERLAP = "overlapSounds"

//#region CONSTS

const iconWhitePath = __dirname + "\\app\\res\\icon_white.ico";
const iconPausedPath = __dirname + "\\app\\res\\icon_dot.ico";
const MainMenu = new Menu();

//#endregion

let tray = null;
let trayMenu;
let minToTray = false;

app.setAppUserModelId("com.tom4nt.megasoundboard");
app.commandLine.appendSwitch('force-color-profile', 'srgb');
app.commandLine.appendSwitch('disable-features', 'ColorCorrectRendering');
app.commandLine.appendSwitch('disable-color-correct-rendering');
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');

//#region Prevent other instances

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
    app.exit(0)
} else {
    app.on('second-instance', (e, args, dir) => {
        console.log(args[args.length - 1].toString())
        if (win) {
            win.show();
            win.focus();
        }
    })
}

//#endregion

//#region Updates

autoUpdater.checkForUpdates();
autoUpdater.on("update-available", () => { win.webContents.send("update.available") });
autoUpdater.on("download-progress", (progress) => { win.webContents.send("update.progress", progress) });
autoUpdater.on("update-downloaded", () => { win.webContents.send("update.ready") });
setInterval(function () {
    autoUpdater.checkForUpdates();
}, 300000); //5 minutes

//#endregion

//#region Init OS things
function createWindow() {
    win = new BrowserWindow({
        show: false,
        width: 850,
        height: 600,
        minWidth: 650,
        minHeight: 420,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: false,
            contextIsolation: false,
            spellcheck: false
        },
        frame: false,
        title: "Mega Soundboard",
        backgroundColor: '#1f1f24'
    });

    win.webContents.on('will-navigate', (e, url) => {
        e.preventDefault()
        shell.openExternal(url)
    })

    win.on('ready-to-show', () => {
        win.show()
    })

    win.on('minimize', function () {
        if (minToTray) {
            win.hide();
        }
    });

    win.on('maximize', function () {
        win.webContents.send('win.maximize')
    })

    win.on('unmaximize', function () {
        win.webContents.send('win.unmaximize')
    })

    win.on('focus', () => {
        win.webContents.send('win.focus')
    })

    win.on('blur', () => {
        win.webContents.send('win.blur')
    })

    win.setMenu(MainMenu);

    win.loadFile('app/index.html');
}

function createTray() {
    tray = new Tray(iconWhitePath);
    tray.setToolTip("Mega Soundboard");
    trayMenu = Menu.buildFromTemplate([{
        id: TRAY_KEYBINDS,
        label: 'Enable keybinds',
        type: 'checkbox',
        click: function () {
            sendkeybindsEnabledState()
            updateIcon(trayMenu.getMenuItemById(TRAY_KEYBINDS).checked)
        }
    },
    {
        id: TRAY_OVERLAP,
        label: 'Overlap sounds',
        type: 'checkbox',
        click: function () {
            sendOverlapSoundsState()
        }
    },
    { type: 'separator' },
    {
        label: 'Show',
        click: function () {
            win.show();
        }
    },
    {
        label: 'Close',
        click: function () {
            app.quit();
        }
    }
    ]);
    tray.setContextMenu(trayMenu);
    tray.on('click', function () {
        win.show();
    });
}
//#endregion

//#region Functions

function sendkeybindsEnabledState() {
    win.webContents.send('settings.enableKeybinds', trayMenu.getMenuItemById(TRAY_KEYBINDS).checked)
}

function sendOverlapSoundsState() {
    win.webContents.send('settings.overlapSounds', trayMenu.getMenuItemById(TRAY_OVERLAP).checked)
}

function updateIcon(enableKeybinds) {
    if (enableKeybinds) {
        tray.setImage(iconWhitePath);
        tray.setToolTip("Mega Soundboard");
    } else {
        tray.setImage(iconPausedPath);
        tray.setToolTip("Mega Soundboard (Keybinds disabled)");
    }
}

function browseSound() {
    var r = dialog.showOpenDialogSync({
        properties: ['openFile'],
        title: 'Select a sound',
        filters: [{ name: "Audio files", extensions: ['mp3', 'wav', 'ogg'] }]
    });
    if (r)
        return r[0];
}

//#endregion

//#region Keybind Events

ioHook.start();
ioHook.on("keydown", event => {
    win.webContents.send("key.down", event.keycode)
});
ioHook.on("keyup", event => {
    win.webContents.send("key.up", event.keycode)
});

//#endregion

//#region Renderer Events

//#region win

ipcMain.on('win.close', function () {
    app.quit();
});

ipcMain.on('win.size', function () {
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

ipcMain.on('win.min', function (e, toTray) {
    //if (toTray) win.hide();
    /*else*/
    win.minimize();
});

ipcMain.on('win.minToTray', (e, val) => {
    minToTray = val
})

//#endregion

ipcMain.handle("key.register", (e, keycode) => {
    const id = ioHook.registerShortcut(keycode, () => {
        win.webContents.send("key.perform", id)
    })
    return id
})

ipcMain.handle("key.unregister", (e, id) => {
    ioHook.unregisterShortcut(id)
})

ipcMain.handle('version', (e) => {
    return app.getVersion()
})

ipcMain.handle('open.url', (e, url) => {
    shell.openExternal(url)
})

ipcMain.on('get.savePath', (e) => {
    e.returnValue = app.getPath("appData") + "\\MegaSoundboard"
})

ipcMain.handle("file.browse", async (e, multiple, typeName, extensions) => {
    const properties = ['openFile']
    if (multiple) properties.push('multiSelections')
    return dialog.showOpenDialog({
        properties: properties,
        filters: [
            { name: typeName, extensions: extensions }
        ]
    }).then((r) => {
        if (r.filePaths && r.filePaths[0]) {
            return multiple ? r.filePaths : r.filePaths[0];
        } else {
            return null
        }
    })
})

ipcMain.handle('folder.browse', async (e) => {
    return dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then((r) => {
        return r.filePaths[0]
    })
})

ipcMain.handle("sound.browse", async (e, multiple) => {
    const properties = ['openFile']
    if (multiple) properties.push('multiSelections')
    return dialog.showOpenDialog({
        properties: properties,
        filters: [
            { name: "Audio files", extensions: ['mp3', 'wav', 'ogg'] }
        ]
    }).then((r) => {
        if (r.filePaths && r.filePaths[0]) {
            return multiple ? r.filePaths : r.filePaths[0];
        } else {
            return null
        }
    })
})

ipcMain.on('update.perform', function () {
    autoUpdater.quitAndInstall();
});

ipcMain.on('settings.enableKeybinds', function (e, state) {
    trayMenu.getMenuItemById(TRAY_KEYBINDS).checked = state;
    updateIcon(state)
})

ipcMain.on('settings.overlapSounds', function (e, state) {
    trayMenu.getMenuItemById(TRAY_OVERLAP).checked = state;
})

//#endregion

//#region App events

app.on("ready", function () {
    createWindow();
    createTray();
});

app.on("will-quit", function () {
    ioHook.unregisterAllShortcuts();
});

//#endregion

//#region --- DEBUG ---

MainMenu.append(new MenuItem({
    label: "Dev Tools",
    accelerator: "Ctrl+Shift+I",
    click: (item, window) => { window.toggleDevTools(); }
}));

MainMenu.append(new MenuItem({
    accelerator: "F5",
    click: (item, window) => {
        ioHook.unregisterAllShortcuts()
        window.reload();
    }
}));

//#endregion
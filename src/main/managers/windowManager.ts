import { BrowserWindow, ipcMain, Menu, MenuItem, shell } from "electron";
import path = require("path");
import InitialContent from "../../shared/models/initialContent";
import EventSender from "../eventSender";
import MS from "../ms";
import Utils from "../utils/utils";

export default class WindowManager {
    private _mainWindow?: BrowserWindow;
    private _loadingWindow?: BrowserWindow;
    private windowContentRequested?: () => InitialContent;

    get mainWindow(): BrowserWindow | undefined { return this._mainWindow; }
    get loadingWindow(): BrowserWindow | undefined { return this._loadingWindow; }

    constructor() {
        ipcMain.on("load", (e) => {
            e.returnValue = this.windowContentRequested ? this.windowContentRequested() : undefined;
        });
    }

    async showLoadingWindow(): Promise<void> {
        const win = new BrowserWindow({
            show: false,
            width: 300,
            height: 300,
            resizable: false,
            frame: false,
            title: "Mega Soundboard",
            backgroundColor: "#1f1f24"
        });
        this._loadingWindow = win;
        await win.loadFile(path.join(Utils.resourcesPath, "loading.html"));
        win.show();
    }

    async showMainWindow(contentRequested: () => InitialContent): Promise<void> {
        this.windowContentRequested = contentRequested;
        await this.showMainWindowInternal();
    }

    private async showMainWindowInternal(): Promise<void> {
        if (this.mainWindow && this.mainWindow.closable) this.mainWindow.close();

        const win = new BrowserWindow({
            show: false,
            width: 850,
            height: 600,
            minWidth: 650,
            minHeight: 420,
            webPreferences: {
                spellcheck: false,
                preload: path.join(__dirname, "../../shared/preload-bundle.js"),
            },
            frame: false,
            title: "Mega Soundboard",
            backgroundColor: "#1f1f24"
        });
        this._mainWindow = win;

        win.webContents.on("will-navigate", (e, url) => {
            e.preventDefault();
            void shell.openExternal(url);
        });

        win.on("ready-to-show", () => {
            win.show();
        });

        win.on("minimize", function () {
            if (MS.instance.isMinToTrayEnabled) {
                win.hide();
            }
            EventSender.send("onWindowStateChanged", "minimized");
        });

        win.on("maximize", function () {
            EventSender.send("onWindowStateChanged", "maximized");
        });

        win.on("unmaximize", function () {
            EventSender.send("onWindowStateChanged", "restored");
        });

        win.on("focus", () => {
            EventSender.send("onWindowFocusChanged", true);
        });

        win.on("blur", () => {
            EventSender.send("onWindowFocusChanged", false);
        });

        win.setMenu(WindowManager.createMenu());
        await win.loadFile(path.join(Utils.resourcesPath, "index.html"));
    }

    private static createMenu(): Menu {
        const m = new Menu();
        m.append(new MenuItem({
            label: "Dev Tools",
            accelerator: "Ctrl+Shift+I",
            click: (_item, window): void => {
                window?.webContents.toggleDevTools();
            }
        }));
        return m;
    }
}

import { BrowserWindow, ipcMain, Menu, MenuItem, shell } from "electron";
import path = require("path");
import InitialContent from "../../shared/models/initialContent";
import EventSender from "../eventSender";
import MS from "../ms";
import Utils from "../utils/utils";

export default class WindowManager {
    private _mainWindow: BrowserWindow;
    private _loadingWindow: BrowserWindow;
    private windowContentRequested?: () => InitialContent;

    get mainWindow(): BrowserWindow { return this._mainWindow; }
    get loadingWindow(): BrowserWindow { return this._loadingWindow; }

    constructor() {
        ipcMain.on("load", (e) => {
            const content = this.windowContentRequested ? this.windowContentRequested() : undefined;
            e.returnValue = content;
        });
        const windows = WindowManager.createWindows();
        this._mainWindow = windows.main;
        this._loadingWindow = windows.load;
    }

    async showLoadingWindow(): Promise<void> {
        await this.loadingWindow.loadFile(path.join(Utils.resourcesPath, "loading.html"));
        this.loadingWindow.show();
    }

    async showMainWindow(contentRequested: () => InitialContent): Promise<void> {
        this.windowContentRequested = contentRequested;
        await this.showMainWindowInternal();
    }

    private async showMainWindowInternal(): Promise<void> {
        await this.mainWindow.loadFile(path.join(Utils.resourcesPath, "index.html"));
        this.mainWindow.show();
    }

    private static createWindows(): { main: BrowserWindow, load: BrowserWindow } {
        const lWin = new BrowserWindow({
            show: false,
            width: 300,
            height: 300,
            resizable: false,
            frame: false,
            title: "Mega Soundboard",
            backgroundColor: "#1f1f24"
        });

        const wWin = new BrowserWindow({
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

        wWin.webContents.on("will-navigate", (e, url) => {
            e.preventDefault();
            void shell.openExternal(url);
        });

        wWin.on("minimize", function () {
            if (MS.instance.isMinToTrayEnabled) {
                wWin.hide();
            }
            EventSender.send("onWindowStateChanged", "minimized");
        });

        wWin.on("maximize", function () {
            EventSender.send("onWindowStateChanged", "maximized");
        });

        wWin.on("unmaximize", function () {
            EventSender.send("onWindowStateChanged", "restored");
        });

        wWin.on("focus", () => {
            EventSender.send("onWindowFocusChanged", true);
        });

        wWin.on("blur", () => {
            EventSender.send("onWindowFocusChanged", false);
        });

        wWin.setMenu(WindowManager.createMenu());

        return { main: wWin, load: lWin };
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

import { BrowserWindow, ipcMain, Menu, MenuItem, screen, shell } from "electron";
import path = require("path");
import InitialContent from "../../shared/models/initialContent";
import EventSender from "../eventSender";
import MS from "../ms";
import Utils from "../utils/utils";

export default class WindowManager {
    private _mainWindow: BrowserWindow;
    private _loadingWindow: BrowserWindow;
    private _initialMaximize: boolean;
    private windowContentRequested?: () => InitialContent;

    get mainWindow(): BrowserWindow { return this._mainWindow; }
    get loadingWindow(): BrowserWindow { return this._loadingWindow; }

    constructor(initialWindowSize: number[], initialPosition: number[], windowIsMaximized: boolean) {
        ipcMain.on("load", (e) => {
            const content = this.windowContentRequested ? this.windowContentRequested() : undefined;
            e.returnValue = content;
        });
        this._loadingWindow = WindowManager.createLoadingWindow();
        this._mainWindow = WindowManager.createMainWindow(initialWindowSize, initialPosition, windowIsMaximized);
        this._initialMaximize = windowIsMaximized;
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
        if (this._initialMaximize) this.mainWindow.maximize();
        else this.mainWindow.show();
    }

    private static createLoadingWindow(): BrowserWindow {
        const lWin = new BrowserWindow({
            show: false,
            width: 300,
            height: 300,
            resizable: false,
            frame: false,
            title: "Mega Soundboard",
            backgroundColor: "#1f1f24"
        });
        return lWin;
    }

    private static createMainWindow(size: number[], position: number[], isMaximized: boolean): BrowserWindow {
        const isValidPos = position.length === 2 &&
            (isMaximized || this.checkWindowPosition(position as [number, number]));

        const wWin = new BrowserWindow({
            show: false,
            x: isValidPos ? position[0] : undefined,
            y: isValidPos ? position[1] : undefined,
            width: size.length === 2 ? size[0] : 850,
            height: size.length === 2 ? size[1] : 600,
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
            if (MS.instance.settingsCache.settings.minToTray) {
                wWin.hide();
            }
            EventSender.send("onWindowStateChanged", "minimized");
        });

        wWin.on("maximize", function () {
            EventSender.send("onWindowStateChanged", "maximized");
            MS.instance.settingsCache.settings.windowIsMaximized = true;
        });

        wWin.on("unmaximize", function () {
            EventSender.send("onWindowStateChanged", "restored");
            MS.instance.settingsCache.settings.windowIsMaximized = false;
        });

        wWin.on("resize", () => {
            if (!wWin.isMaximized()) {
                MS.instance.settingsCache.settings.windowSize = wWin.getSize();
            }
        });

        wWin.on("move", () => {
            MS.instance.settingsCache.settings.windowPosition = wWin.getPosition();
        });

        wWin.on("focus", () => {
            EventSender.send("onWindowFocusChanged", true);
        });

        wWin.on("blur", () => {
            EventSender.send("onWindowFocusChanged", false);
        });

        wWin.setMenu(WindowManager.createMenu());

        return wWin;
    }

    private static checkWindowPosition(position: [number, number]): boolean {
        const displays = screen.getAllDisplays();
        const display = displays.find(x => Utils.isPointInsideRect(position, x.bounds));
        return display !== undefined;
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

import { BrowserWindow, Menu, MenuItem, shell } from "electron";
import path = require("path");
import EventSender from "../eventSender";
import MS from "../ms";
import Utils from "../utils/utils";

export default class WindowManager {
    readonly window!: BrowserWindow;

    private constructor(window: BrowserWindow) { this.window = window; }

    static createWindow(): WindowManager {
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

        const instance = new WindowManager(win);

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
        void WindowManager.loadHTML(win);

        return instance;
    }

    private static async loadHTML(win: BrowserWindow): Promise<void> {
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

        m.append(new MenuItem({
            accelerator: "F5",
            click: (_item, window): void => {
                // ioHook.unregisterAllShortcuts();
                window?.reload();
            }
        }));
        return m;
    }
}

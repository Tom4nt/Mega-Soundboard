import { app, BrowserWindow, Menu, Tray } from "electron";
import MS from "./ms";

const iconWhitePath = __dirname + "\\app\\res\\icon_white.ico";
const iconPausedPath = __dirname + "\\app\\res\\icon_dot.ico";

enum TrayItem {
    EnableKybinds = "trayIcon:enableKeybinds",
    EnableOverlapSounds = "trayIcon:enableOverlapSounds"
}

export default class TrayManager {
    private tray!: Tray;
    private trayMenu!: Menu;

    private constructor() { /* */ }

    static createTray(win: BrowserWindow): TrayManager {
        const instance = new TrayManager();
        instance.tray = new Tray(iconWhitePath);
        instance.tray.setToolTip("Mega Soundboard");
        instance.trayMenu = Menu.buildFromTemplate([{
            id: TrayItem.EnableKybinds,
            label: "Enable keybinds",
            type: "checkbox",
            click: (): void => {
                MS.instance.toggleKeybindsState();
            }
        },
        {
            id: TrayItem.EnableOverlapSounds,
            label: "Overlap sounds",
            type: "checkbox",
            click: (): void => {
                MS.instance.toggleOverlapSoundsState();
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

        instance.tray.setContextMenu(instance.trayMenu);
        instance.tray.on("click", () => {
            win.show();
        });

        return instance;
    }

    update(): void {
        if (MS.instance.isKeybindsEnabled) {
            this.tray.setImage(iconWhitePath);
            this.tray.setToolTip("Mega Soundboard");
        } else {
            this.tray.setImage(iconPausedPath);
            this.tray.setToolTip("Mega Soundboard (Keybinds disabled)");
        }

        const keysItem = this.trayMenu.getMenuItemById(TrayItem.EnableKybinds);
        if (keysItem) keysItem.checked = MS.instance.isKeybindsEnabled;

        const overlapItem = this.trayMenu.getMenuItemById(TrayItem.EnableOverlapSounds);
        if (overlapItem) overlapItem.checked = MS.instance.isOverlapEnabled;
    }
}
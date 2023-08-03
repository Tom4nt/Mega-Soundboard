import { app, BrowserWindow, Menu, Tray } from "electron";
import MS from "../ms";
import * as path from "path";
import Utils from "../utils/utils";

const iconWhitePath = path.join(Utils.resourcesPath, "icon_white.ico");
const iconPausedPath = path.join(Utils.resourcesPath, "icon_dot.ico");

enum TrayItem {
    EnableKybinds = "trayIcon:enableKeybinds",
    EnableOverlapSounds = "trayIcon:enableOverlapSounds",
    LoopSounds = "trayIcon:loopSounds"
}

export default class TrayManager {
    private tray!: Tray;
    private trayMenu!: Menu;

    private constructor() { /* */ }

    static createTray(win: BrowserWindow, keybindsEnabled: boolean, overlapSounds: boolean, loopSounds: boolean): TrayManager {
        const instance = new TrayManager();
        instance.tray = new Tray(iconWhitePath);
        instance.trayMenu = Menu.buildFromTemplate([{
            id: TrayItem.EnableKybinds,
            label: "Enable keybinds",
            type: "checkbox",
            click: (): void => {
                void MS.instance.toggleKeybindsState();
            }
        },
        {
            id: TrayItem.EnableOverlapSounds,
            label: "Overlap sounds",
            type: "checkbox",
            click: (): void => {
                void MS.instance.toggleOverlapSoundsState();
            }
        },
        {
            id: TrayItem.LoopSounds,
            label: "Loop sounds",
            type: "checkbox",
            click: (): void => {
                void MS.instance.toggleLoopSoundsState();
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

        instance.update(keybindsEnabled, overlapSounds, loopSounds);
        return instance;
    }

    update(keybindsEnabled: boolean, overlapSounds: boolean, loopSounds: boolean): void {
        if (keybindsEnabled) {
            this.tray.setImage(iconWhitePath);
            this.tray.setToolTip("Mega Soundboard");
        } else {
            this.tray.setImage(iconPausedPath);
            this.tray.setToolTip("Mega Soundboard (Keybinds disabled)");
        }

        const keysItem = this.trayMenu.getMenuItemById(TrayItem.EnableKybinds);
        if (keysItem) keysItem.checked = keybindsEnabled;

        const overlapItem = this.trayMenu.getMenuItemById(TrayItem.EnableOverlapSounds);
        if (overlapItem) overlapItem.checked = overlapSounds;

        const loopSoundsItem = this.trayMenu.getMenuItemById(TrayItem.LoopSounds);
        if (loopSoundsItem) loopSoundsItem.checked = loopSounds;
    }
}

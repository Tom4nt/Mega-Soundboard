import { fromMain } from "../shared/ipcChannels";
import TrayManager from "./trayManager";
import WindowManager from "./windowManager";

/** Represents the app instance in the main process. */
export default class MS {
    isKeybindsEnabled = false;
    isOverlapEnabled = false;
    isMinToTrayEnabled = false;

    isRecordingKey = false;
    modalsOpen = 0;

    static readonly latestWithLog = 2; // Increments on every version that should display the changelog.

    private static _instance?: MS;
    public static get instance(): MS {
        if (!MS._instance) throw Error("MS Singleton was not initialized");
        return MS._instance;
    }
    private static set instance(value: MS) {
        MS._instance = value;
    }

    constructor(
        public readonly windowManager: WindowManager,
        public readonly trayManager: TrayManager,
    ) {
        MS.instance = this;
    }

    toggleKeybindsState(): void {
        this.isKeybindsEnabled = !this.isKeybindsEnabled;
        this.trayManager.update();
        this.windowManager.window.webContents.send(fromMain.keybindsStateChanged, this.isKeybindsEnabled);
    }

    toggleOverlapSoundsState(): void {
        this.isOverlapEnabled = !this.isOverlapEnabled;
        this.trayManager.update();
        this.windowManager.window.webContents.send(fromMain.overlapSoundsChanged, this.isOverlapEnabled);
    }

    setMinToTray(state: boolean): void {
        this.isMinToTrayEnabled = state;
        this.windowManager.window.webContents.send(fromMain.minToTrayChanged, state);
    }
}
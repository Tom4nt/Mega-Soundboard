import { autoUpdater } from "electron-updater";
import EventSender from "./eventSender";
import { UpdaterState } from "../shared/interfaces";

/** Wrapper for the Electron Auto Updater to keep track of the state. Singleton. */
export default class Updater {
    private static _instance = new Updater();
    public static get instance(): Updater { return this._instance; }

    private _state: UpdaterState = "unknown";
    public get state(): UpdaterState { return this._state; }

    private constructor() {
        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = true;

        autoUpdater.on("update-downloaded", () => {
            this._state = "downloaded";
            EventSender.send("onUpdateReady");
        });

        const hour = 60 * 60 * 1000;
        setInterval(() => {
            void this.check();
        }, hour);
    }

    public async check(): Promise<UpdaterState> {
        if (this._state === "downloading" || this._state === "downloaded") {
            return this.state;
        }
        const result = await autoUpdater.checkForUpdates();
        if (result) {
            this._state = "downloading";
        } else {
            this._state = "upToDate";
        }
        return this.state;
    }
}

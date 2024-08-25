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
			EventSender.send("updateStateChanged", "downloaded");
		});

		autoUpdater.on("update-available", () => {
			this._state = "downloading";
			EventSender.send("updateStateChanged", "downloading");
		});

		autoUpdater.on("update-not-available", () => {
			this._state = "upToDate";
			EventSender.send("updateStateChanged", "upToDate");
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
		await autoUpdater.checkForUpdates();
		// FWIK, there is no way to get if the update is available or not from the return value.
		return this.state; // The state is updated on the event handlers instead.
	}
}

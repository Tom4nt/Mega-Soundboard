import { app, dialog, ipcMain, shell } from "electron";
import { promises as fs } from "fs";
import { autoUpdater } from "electron-updater";
import { Actions, actionsKeys } from "../shared/ipcActions";
import MS from "./ms";
import path = require("path");
import { validSoundExts } from "../shared/sharedUtils";
import Utils from "./utils/utils";
import ZoomUtils from "./utils/zoomUtils";
import EventSender from "./eventSender";
import { actionBindings } from "./quickActionBindings";
import Updater from "./updater";
import { Soundboard } from "./data/models/soundboard";
import { Sound } from "./data/models/sound";
import UuidTree from "./data/models/uuidTree";

export default class IPCHandler {
	public static register(): void {
		for (const action of actionsKeys) {
			this.addHandler(action);
		}
	}

	public static addHandler<T extends keyof Actions>(name: T): void {
		const f = implementer[name] as (...args: unknown[]) => unknown;
		ipcMain.handle(name, (_e, args) => f(...args as unknown[]));
	}

	public static removeActionHandle<T extends keyof Actions>(name: T): void {
		ipcMain.removeHandler(name);
	}
}

const implementer: Actions = {
	minimize() {
		MS.instance.windowManager.mainWindow.minimize();
	},

	toggleMaximizedState() {
		if (MS.instance.windowManager.mainWindow.isMaximized()) {
			MS.instance.windowManager.mainWindow.unmaximize();
		} else {
			MS.instance.windowManager.mainWindow.maximize();
		}
	},

	close() {
		app.quit();
	},

	zoomIncrement(value) {
		const wc = MS.instance.windowManager.mainWindow.webContents;
		ZoomUtils.incrementZoomFactor(wc, value);
		EventSender.send("zoomFactorChanged", wc.getZoomFactor());
	},

	zoomSet(value) {
		const wc = MS.instance.windowManager.mainWindow.webContents;
		ZoomUtils.setZoomFactor(wc, value);
		EventSender.send("zoomFactorChanged", wc.getZoomFactor());
	},

	async zoomGet() {
		return MS.instance.windowManager.mainWindow.webContents.getZoomFactor();
	},

	zoomReset() {
		const wc = MS.instance.windowManager.mainWindow.webContents;
		wc.setZoomFactor(1);
		EventSender.send("zoomFactorChanged", wc.getZoomFactor());
	},

	async addSounds(playables, destinationId, moveFile, startIndex) {
		const sb = await MS.instance.soundboardsCache.addSounds(playables, destinationId, moveFile, startIndex);
		return sb.getUuid();
	},

	editPlayable(data) {
		void MS.instance.soundboardsCache.editPlayable(data);
	},

	copyOrMovePlayable(id, destinationId, move, destinationIndex) {
		void MS.instance.soundboardsCache.copyOrMove(id, destinationId, destinationIndex, move);
	},

	deletePlayable(id) {
		MS.instance.audioManager.stop(id);
		void MS.instance.soundboardsCache.removePlayable(id);
	},

	getSoundDataFromPaths(paths) {
		const sounds = Sound.getNewSoundsFromPaths(paths);
		return Promise.resolve(sounds.map(s => s.asData()));
	},

	getValidSoundPaths(paths) {
		const valid = Sound.getValidSoundPaths(paths);
		return Promise.resolve(valid);
	},

	async getPlayableRoot(uuid) {
		const root = MS.instance.soundboardsCache.findSoundboardOf(uuid);
		return root?.asData();
	},

	async getPlayable(uuid) {
		const soundboard = MS.instance.soundboardsCache.findSoundboardOf(uuid);
		const playable = MS.instance.soundboardsCache.find(uuid);
		const playingUuids = MS.instance.audioManager.playingInstances;
		const tree = MS.instance.soundboardsCache.getGeneralTree();
		const nodes = tree.nodes.find(n => n.uuid === uuid)?.getFlatChildren();
		if (!nodes || !playable) return undefined;

		const uuids = nodes.map(n => n.uuid);
		return {
			data: playable.asData(),
			isPlaying: playingUuids.some(p => uuids.includes(p)),
			isInLinkedSoundboard: soundboard?.linkedFolder !== null,
		};
	},

	async getContainerItems(uuid) {
		const soundboard = MS.instance.soundboardsCache.findSoundboardOf(uuid);
		const container = MS.instance.soundboardsCache.getContainer(uuid);
		if (!container) return [];

		const tree = new UuidTree(container);
		const playingUuids = MS.instance.audioManager.playingInstances;
		return container.getChildren().map(p => {
			const node = tree.nodes.find(n => n.uuid === p.getUuid());
			const nodes = node?.getFlatChildren();
			const uuids = nodes?.map(n => n.uuid);
			return {
				data: p.asData(),
				isPlaying: playingUuids.some(x => uuids?.includes(x)),
				isInLinkedSoundboard: soundboard?.linkedFolder !== null,
			};
		});
	},

	createGroup(mainUuid, secondUuid, copy) {
		void MS.instance.soundboardsCache.createGroup(mainUuid, secondUuid, copy);
	},

	ungroupGroup(groupUuid) {
		void MS.instance.soundboardsCache.unGroupGroup(groupUuid);
	},

	getSoundboard(uuid) {
		const sb = MS.instance.soundboardsCache.soundboards.find(x => x.uuid === uuid);
		const isAlone = MS.instance.soundboardsCache.soundboards.length === 1;
		if (!sb) throw Error(`Soundboard with runtime UUID ${uuid} could not be found.`);
		return Promise.resolve({ soundboard: sb.asData(), isAlone });
	},

	async getNewSoundboard() {
		const sb: Soundboard = Soundboard.getDefault("");
		return await Promise.resolve(sb.asData());
	},

	addSoundboard(soundboard) {
		void MS.instance.soundboardsCache.addSoundboard(soundboard);
	},

	moveSoundboard(soundboardId, destinationIndex) {
		void (async (): Promise<void> => {
			const selectedIndex = MS.instance.settingsCache.settings.selectedSoundboard;
			const selected = MS.instance.soundboardsCache.soundboards[selectedIndex];
			if (!selected) throw new Error("Cannot move: Current selected soundboard index is out of bounds.");
			const isCurrent = selected.uuid === soundboardId;
			await MS.instance.soundboardsCache.moveSoundboard(soundboardId, isCurrent, destinationIndex);
			const index = MS.instance.soundboardsCache.findSoundboardIndex(selected.uuid);
			MS.instance.settingsCache.settings.selectedSoundboard = index; // Update the index because it changed.
		})();
	},

	deleteSoundboard(soundboardId) {
		void (async (): Promise<void> => {
			const selectedIndex = MS.instance.settingsCache.settings.selectedSoundboard;
			const selected = MS.instance.soundboardsCache.soundboards[selectedIndex];
			if (!selected) throw new Error("Cannot delete: Current selected soundboard index is out of bounds.");
			await MS.instance.soundboardsCache.removeSoundboard(soundboardId);
			if (soundboardId === selected.uuid)
				await MS.instance.setCurrentSoundboard(MS.instance.soundboardsCache.soundboards[0]!);
			else { // Update the index because it might have changed after removing a soundboard.
				const index = MS.instance.soundboardsCache.findSoundboardIndex(selected.uuid);
				MS.instance.settingsCache.settings.selectedSoundboard = index;
			}
		})();
	},

	editSoundboard(soundboard) {
		void MS.instance.soundboardsCache.editSoundboard(soundboard);
	},

	setCurrentSoundboard(uuid) {
		const soundboardIndex = MS.instance.soundboardsCache.findSoundboardIndex(uuid);
		const soundboard = MS.instance.soundboardsCache.soundboards[soundboardIndex]!;
		void MS.instance.setCurrentSoundboard(soundboard);
	},

	async getCurrentSoundboard() { return MS.instance.getCurrentSoundboard()?.asData(); },

	async getSoundboards() {
		return MS.instance.soundboardsCache.soundboards.map(s => s.asData());
	},

	async getInitialSoundboardIndex() {
		const lastSoundboardIndex = MS.instance.soundboardsCache.soundboards.length - 1;
		let index = MS.instance.settingsCache.settings.selectedSoundboard;
		if (index < 0) index = 0;
		if (index > lastSoundboardIndex) index = lastSoundboardIndex;
		return index;
	},

	async sortSoundboard(soundboardId) {
		await MS.instance.soundboardsCache.sortContainer(soundboardId);
	},

	flagChangelogViewed() {
		MS.instance.flagChangelogViewed();
	},

	installUpdate() {
		autoUpdater.quitAndInstall();
	},

	async checkUpdate() {
		return await Updater.instance.check();
	},

	setMainDevice(id, volume) {
		void MS.instance.settingsCache.setMainDevice(id, volume);
	},

	setSecondaryDevice(id, volume) {
		void MS.instance.settingsCache.setSecondaryDevice(id, volume);
	},

	async getSettings() {
		return MS.instance.settingsCache.settings;
	},

	saveSettings(settings) {
		void MS.instance.settingsCache.save(settings);
		if (settings.processKeysOnRelease != null)
			MS.instance.keybindManager.processKeysOnRelease = settings.processKeysOnRelease;
	},

	async shouldShowChangelog() {
		return MS.instance.settingsCache.shouldShowChangelog();
	},

	async executeQuickAction(name) {
		await actionBindings[name](name as never, false);
	},

	openRepo() {
		void shell.openExternal("https://github.com/Tom4nt/Mega-Soundboard");
	},

	openFeedback() {
		void shell.openExternal("https://github.com/Tom4nt/Mega-Soundboard/issues/new/choose");
	},

	async browseSounds() {
		const r = await dialog.showOpenDialog({
			properties: ["openFile", "multiSelections"],
			filters: [
				{ name: "Audio files", extensions: validSoundExts }
			]
		});
		return r.filePaths;
	},

	async browseFolder() {
		const r = await dialog.showOpenDialog({
			properties: ["openDirectory"]
		});
		return r.filePaths[0];
	},

	getNameFromPath(path) {
		const name = Utils.getNameFromFile(path);
		return Promise.resolve(name);
	},

	async getDefaultMovePath() {
		return MS.defaultSoundsPath;
	},

	async parsePath(path) {
		return Utils.parsePath(path);
	},

	async startKeyRecordingSession() {
		return MS.instance.keybindManager.startRecordingSession();
	},

	stopKeyRecordingSession(id) {
		MS.instance.keybindManager.stopRecordingSession(id);
	},

	async getNewsHtml() {
		return await fs.readFile(path.join(__dirname, "../res/news.html"), "utf-8");
	},

	async getVersion() {
		return app.getVersion();
	},

	// Audio Manager

	play(uuid) {
		MS.instance.audioManager.play(uuid, false);
	},

	stop(uuid) {
		const sounds = MS.instance.soundboardsCache.getAllSounds(uuid);
		const uuids = sounds.map(s => s.uuid);
		MS.instance.audioManager.stopMultiple(uuids);
	},

	stopAll() {
		MS.instance.audioManager.stopAll();
	},

	soundEnd(instanceUuid) {
		MS.instance.audioManager.stopInstance(instanceUuid);
	},
};

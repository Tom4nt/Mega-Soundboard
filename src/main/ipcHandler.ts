import { app, dialog, ipcMain, shell } from "electron";
import { promises as fs } from "fs";
import { autoUpdater } from "electron-updater";
import { Soundboard } from "../shared/models";
import { Actions, actionsKeys } from "../shared/ipcActions";
import MS from "./ms";
import path = require("path");
import SoundUtils from "./utils/soundUtils";
import { randomUUID } from "crypto";
import { validSoundExts } from "../shared/sharedUtils";
import Utils from "./utils/utils";
import ZoomUtils from "./utils/zoomUtils";
import EventSender from "./eventSender";
import { actionBindings } from "./quickActionBindings";
import Updater from "./updater";

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
        EventSender.send("onZoomFactorChanged", wc.getZoomFactor());
    },

    zoomSet(value) {
        const wc = MS.instance.windowManager.mainWindow.webContents;
        ZoomUtils.setZoomFactor(wc, value);
        EventSender.send("onZoomFactorChanged", wc.getZoomFactor());
    },

    async zoomGet() {
        return MS.instance.windowManager.mainWindow.webContents.getZoomFactor();
    },

    zoomReset() {
        const wc = MS.instance.windowManager.mainWindow.webContents;
        wc.setZoomFactor(1);
        EventSender.send("onZoomFactorChanged", wc.getZoomFactor());
    },

    async addSounds(sounds, soundboardId, moveFile, startIndex) {
        const sb = await MS.instance.soundboardsCache.addSounds(sounds, soundboardId, moveFile, startIndex);
        await MS.instance.setCurrentSoundboard(sb);
    },

    editSound(sound) {
        void MS.instance.soundboardsCache.editSound(sound);
    },

    async moveSound(soundId, destinationSoundboardId, destinationIndex) {
        const sb = await MS.instance.soundboardsCache.moveSound(soundId, destinationSoundboardId, destinationIndex, false);
        await MS.instance.setCurrentSoundboard(sb);
    },

    async copySound(soundId, destinationSoundboardId, destinationIndex) {
        const sb = await MS.instance.soundboardsCache.moveSound(soundId, destinationSoundboardId, destinationIndex, true);
        await MS.instance.setCurrentSoundboard(sb);
    },

    deleteSound(soundId) {
        void MS.instance.soundboardsCache.removeSound(soundId);
    },

    getNewSoundsFromPaths(paths) {
        const currentSoundboard = MS.instance.getCurrentSoundboard();
        if (!currentSoundboard) throw new Error("Cannot find current soundboard.");
        const sounds = SoundUtils.getNewSoundsFromPaths(paths, currentSoundboard.uuid);
        return Promise.resolve(sounds);
    },

    getValidSoundPaths(paths) {
        const valid = SoundUtils.getValidSoundPaths(paths);
        return Promise.resolve(valid);
    },

    getSoundboard(uuid) {
        const sb = MS.instance.soundboardsCache.soundboards.find(x => x.uuid === uuid);
        if (!sb) throw Error(`Soundboard with runtime UUID ${uuid} could not be found.`);
        return Promise.resolve(sb);
    },

    async getNewSoundboard() {
        const sb = new Soundboard(randomUUID(), "", [], 100, null, []);
        return await Promise.resolve(sb);
    },

    addSoundboard(soundboard) {
        void MS.instance.soundboardsCache.addSoundboard(soundboard);
    },

    moveSoundboard(soundboardId, destinationIndex) {
        void (async (): Promise<void> => {
            const selectedIndex = MS.instance.settingsCache.settings.selectedSoundboard;
            const selected = MS.instance.soundboardsCache.soundboards[selectedIndex];
            if (!selected) throw new Error("Cannot move: Current selected soundboard index is out of bounds.");
            await MS.instance.soundboardsCache.moveSoundboard(soundboardId, destinationIndex);
            await MS.instance.setCurrentSoundboard(selected);
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

    setCurrentSoundboard(id) {
        const soundboardIndex = MS.instance.soundboardsCache.findSoundboardIndex(id);
        const soundboard = MS.instance.soundboardsCache.soundboards[soundboardIndex]!;
        void MS.instance.setCurrentSoundboard(soundboard);
    },

    async getSoundboards() {
        return MS.instance.soundboardsCache.soundboards;
    },

    async getInitialSoundboardIndex() {
        const lastSoundboardIndex = MS.instance.soundboardsCache.soundboards.length - 1;
        let index = MS.instance.settingsCache.settings.selectedSoundboard;
        if (index < 0) index = 0;
        if (index > lastSoundboardIndex) index = lastSoundboardIndex;
        return index;
    },

    async sortSoundboard(soundboardId) {
        await MS.instance.soundboardsCache.sortSoundboard(soundboardId);
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
        await actionBindings[name](name as never);
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

    async holdPTT() {
        return MS.instance.keybindManager.holdKeys(MS.instance.settingsCache.settings.pttKeys);
    },

    async releasePTT(handle) {
        MS.instance.keybindManager.releaseKeys(handle);
    },

    async getNewsHtml() {
        return await fs.readFile(path.join(__dirname, "../res/news.html"), "utf-8");
    },

    async getVersion() {
        return app.getVersion();
    },
};

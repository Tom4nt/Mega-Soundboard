import { app, dialog, ipcMain, shell } from "electron";
import { promises as fs } from "fs";
import { autoUpdater } from "electron-updater";
import { Soundboard } from "../shared/models";
import { Actions } from "../shared/ipcActions";
import MS from "./ms";
import path = require("path");
import SoundUtils from "./utils/soundUtils";
import { randomUUID } from "crypto";
import SharedUtils from "../shared/sharedUtils";
import Utils from "./utils/utils";
import ZoomUtils from "./utils/zoomUtils";
import EventSender from "./eventSender";

export default class IPCHandler {
    public static handleAction<T extends keyof Actions>(name: T, handler: Actions[T]): void {
        const f = handler as (...args: unknown[]) => unknown;
        ipcMain.handle(name, (_e, args) => f(...args as unknown[]));
    }

    public static removeActionHandle<T extends keyof Actions>(name: T): void {
        ipcMain.removeHandler(name);
    }

    static init(): void {

        this.handleAction("minimize", () => {
            MS.instance.windowManager.mainWindow.minimize();
        });

        this.handleAction("toggleMaximizedState", () => {
            if (MS.instance.windowManager.mainWindow.isMaximized()) {
                MS.instance.windowManager.mainWindow.unmaximize();
            } else {
                MS.instance.windowManager.mainWindow.maximize();
            }
        });

        this.handleAction("close", () => {
            app.quit();
        });


        this.handleAction("zoomIncrement", (value) => {
            const wc = MS.instance.windowManager.mainWindow.webContents;
            ZoomUtils.incrementZoomFactor(wc, value);
            EventSender.send("onZoomFactorChanged", wc.getZoomFactor());
        });

        this.handleAction("zoomSet", (value) => {
            const wc = MS.instance.windowManager.mainWindow.webContents;
            ZoomUtils.setZoomFactor(wc, value);
            EventSender.send("onZoomFactorChanged", wc.getZoomFactor());
        });

        this.handleAction("zoomGet", async () => {
            return MS.instance.windowManager.mainWindow.webContents.getZoomFactor();
        });

        this.handleAction("zoomReset", () => {
            const wc = MS.instance.windowManager.mainWindow.webContents;
            wc.setZoomFactor(1);
            EventSender.send("onZoomFactorChanged", wc.getZoomFactor());
        });


        this.handleAction("addSounds", (sounds, soundboardId, move, startIndex) => {
            void MS.instance.soundboardsCache.addSounds(sounds, soundboardId, move, startIndex);
        });

        this.handleAction("editSound", sound => {
            void MS.instance.soundboardsCache.editSound(sound);
        });

        this.handleAction("moveSound", (soundId, destinationSoundboardId, destinationIndex) => {
            void MS.instance.soundboardsCache.moveSound(soundId, destinationSoundboardId, destinationIndex);
        });

        this.handleAction("deleteSound", soundId => {
            void MS.instance.soundboardsCache.removeSound(soundId);
        });

        this.handleAction("getNewSoundsFromPaths", paths => {
            const sounds = SoundUtils.getNewSoundsFromPaths(paths);
            return Promise.resolve(sounds);
        });

        this.handleAction("getValidSoundPaths", paths => {
            const valid = SoundUtils.getValidSoundPaths(paths);
            return Promise.resolve(valid);
        });


        this.handleAction("getSoundboard", (uuid) => {
            const sb = MS.instance.soundboardsCache.soundboards.find(x => x.uuid === uuid);
            if (!sb) throw Error(`Soundboard with runtime UUID ${uuid} could not be found.`);
            return Promise.resolve(sb);
        });

        this.handleAction("getNewSoundboard", async () => {
            const sb = new Soundboard(randomUUID(), "", [], 100, null, []);
            return await Promise.resolve(sb);
        });

        this.handleAction("addSoundboard", async soundboard => {
            await MS.instance.soundboardsCache.addSoundboard(soundboard);
        });

        this.handleAction("moveSoundboard", async (soundboardId, destinationIndex) => {
            const selectedIndex = MS.instance.settingsCache.settings.selectedSoundboard;
            const selected = MS.instance.soundboardsCache.soundboards[selectedIndex];
            await MS.instance.soundboardsCache.moveSoundboard(soundboardId, destinationIndex);
            await MS.instance.setCurrentSoundboard(selected);
        });

        this.handleAction("deleteSoundboard", async soundboardId => {
            const selectedIndex = MS.instance.settingsCache.settings.selectedSoundboard;
            const selectedUuid = MS.instance.soundboardsCache.soundboards[selectedIndex].uuid;
            await MS.instance.soundboardsCache.removeSoundboard(soundboardId);
            if (soundboardId === selectedUuid)
                await MS.instance.setCurrentSoundboard(MS.instance.soundboardsCache.soundboards[0]);
        });

        this.handleAction("editSoundboard", async soundboard => {
            await MS.instance.soundboardsCache.editSoundboard(soundboard);
        });

        this.handleAction("setCurrentSoundboard", async id => {
            const soundboardIndex = MS.instance.soundboardsCache.findSoundboardIndex(id);
            const soundboard = MS.instance.soundboardsCache.soundboards[soundboardIndex];
            await MS.instance.setCurrentSoundboard(soundboard);
        });

        this.handleAction("getSoundboards", () => {
            const soundboards = MS.instance.soundboardsCache.soundboards;
            return Promise.resolve(soundboards);
        });

        this.handleAction("getInitialSoundboardIndex", () => {
            const lastSoundboardIndex = MS.instance.soundboardsCache.soundboards.length - 1;
            let index = MS.instance.settingsCache.settings.selectedSoundboard;
            if (index < 0) index = 0;
            if (index > lastSoundboardIndex) index = lastSoundboardIndex;
            return Promise.resolve(index);
        });

        this.handleAction("sortSoundboard", async soundboardId => {
            await MS.instance.soundboardsCache.sortSoundboard(soundboardId);
        });


        this.handleAction("flagChangelogViewed", () => {
            MS.instance.flagChangelogViewed();
        });

        this.handleAction("installUpdate", () => {
            autoUpdater.quitAndInstall();
        });


        this.handleAction("setMainDevice", (id, volume) => {
            void MS.instance.settingsCache.setMainDevice(id, volume);
        });

        this.handleAction("setSecondaryDevice", (id, volume) => {
            void MS.instance.settingsCache.setSecondaryDevice(id, volume);
        });


        this.handleAction("getSettings", () => {
            return Promise.resolve(MS.instance.settingsCache.settings);
        });

        this.handleAction("saveSettings", settings => {
            void MS.instance.settingsCache.save(settings);
            if (settings.processKeysOnRelease != null)
                MS.instance.keybindManager.processKeysOnRelease = settings.processKeysOnRelease;
        });

        this.handleAction("shouldShowChangelog", () => {
            return Promise.resolve(MS.instance.settingsCache.shouldShowChangelog());
        });

        this.handleAction("toggleKeybindsState", async () => {
            await MS.instance.toggleKeybindsState();
        });

        this.handleAction("toggleOverlapSoundsState", async () => {
            await MS.instance.toggleOverlapSoundsState();
        });


        this.handleAction("openRepo", () => {
            void shell.openExternal("https://github.com/Tom4nt/Mega-Soundboard");
        });

        this.handleAction("openBugReport", () => {
            void shell.openExternal("https://github.com/Tom4nt/Mega-Soundboard/issues/new?assignees=&labels=bug&template=bug_report.md");
        });


        this.handleAction("browseSounds", async () => {
            const r = await dialog.showOpenDialog({
                properties: ["openFile", "multiSelections"],
                filters: [
                    { name: "Audio files", extensions: SharedUtils.validSoundExts }
                ]
            });
            return r.filePaths;
        });

        this.handleAction("browseFolder", async () => {
            const r = await dialog.showOpenDialog({
                properties: ["openDirectory"]
            });
            return r.filePaths[0];
        });

        this.handleAction("getNameFromPath", p => {
            const name = Utils.getNameFromFile(p);
            return Promise.resolve(name);
        });

        this.handleAction("getDefaultMovePath", async () => {
            return MS.defaultSoundsPath;
        });

        this.handleAction("parsePath", async p => {
            return Utils.parsePath(p);
        });


        this.handleAction("startKeyRecordingSession", async () => {
            return MS.instance.keybindManager.startRecordingSession();
        });

        this.handleAction("stopKeyRecordingSession", uuid => {
            MS.instance.keybindManager.stopRecordingSession(uuid);
        });

        this.handleAction("holdPTT", async () => {
            return MS.instance.keybindManager.holdKeys(MS.instance.settingsCache.settings.pttKeys);
        });

        this.handleAction("releasePTT", async handle => {
            MS.instance.keybindManager.releaseKeys(handle);
        });


        this.handleAction("playRandomSound", async () => {
            MS.instance.playRandomSound();
        });


        this.handleAction("getNewsHtml", async () => {
            return await fs.readFile(path.join(__dirname, "../res/news.html"), "utf-8");
        });


        this.handleAction("getVersion", () => {
            return Promise.resolve(app.getVersion());
        });
    }
}

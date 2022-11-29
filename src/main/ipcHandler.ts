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
            MS.instance.windowManager.mainWindow?.minimize();
        });

        this.handleAction("toggleMaximizedState", () => {
            if (MS.instance.windowManager.mainWindow?.isMaximized()) {
                MS.instance.windowManager.mainWindow.unmaximize();
            } else {
                MS.instance.windowManager.mainWindow?.maximize();
            }
        });

        this.handleAction("close", () => {
            app.quit();
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


        this.handleAction("getNewSoundboard", async () => {
            const sb = new Soundboard(randomUUID());
            return await Promise.resolve(sb);
        });

        this.handleAction("addSoundboard", soundboard => {
            void MS.instance.soundboardsCache.addSoundboard(soundboard);
        });

        this.handleAction("moveSoundboard", async (soundboardId, destinationIndex) => {
            const selectedIndex = MS.instance.settingsCache.settings.selectedSoundboard;
            const selected = MS.instance.soundboardsCache.soundboards[selectedIndex];
            await MS.instance.soundboardsCache.moveSoundboard(soundboardId, destinationIndex);
            await MS.instance.setCurrentSoundboard(selected);
        });

        this.handleAction("deleteSoundboard", soundboardId => {
            void MS.instance.soundboardsCache.removeSoundboard(soundboardId);
        });

        this.handleAction("editSoundboard", soundboard => {
            void MS.instance.soundboardsCache.editSoundboard(soundboard);
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
        });

        this.handleAction("shouldShowChangelog", () => {
            return Promise.resolve(MS.instance.settingsCache.shouldShowChangelog());
        });

        this.handleAction("setMinimizeToTray", state => {
            MS.instance.setMinToTray(state);
        });

        this.handleAction("toggleKeybindsState", () => {
            MS.instance.toggleKeybindsState();
        });

        this.handleAction("toggleOverlapSoundsState", () => {
            MS.instance.toggleOverlapSoundsState();
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

        this.handleAction("isPathValid", async (path, type) => {
            if (type === "folder") {
                return await Utils.isPathValid(path, type);
            }
            else {
                return await Utils.isPathValid(path, "file", SharedUtils.validSoundExts);
            }
        });

        this.handleAction("getNameFromPath", p => {
            const name = Utils.getNameFromFile(p);
            return Promise.resolve(name);
        });


        this.handleAction("startKeyRecordingSession", () => {
            // TODO: Handle in the KeybindManager
            return Promise.resolve("TODO");
        });

        this.handleAction("stopKeyRecordingSession", id => {
            // TODO: Handle in the KeybindManager
        });


        this.handleAction("getNewsHtml", async () => {
            return await fs.readFile(path.join(__dirname, "../res/news.html"), "utf-8");
        });


        this.handleAction("getVersion", () => {
            return Promise.resolve(app.getVersion());
        });
    }
}

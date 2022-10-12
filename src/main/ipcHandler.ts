import { app, dialog, ipcMain, shell } from "electron";
import { promises as fs } from "fs";
import { autoUpdater } from "electron-updater";
import { getFromRenderer } from "../shared/ipcChannels";
import { OptionalSettings, Sound, Soundboard } from "../shared/models";
import MS from "./ms";

export default class IPCHandler {
    static init(): void {

        ipcMain.on(getFromRenderer("toggleKeybindsState"), () => {
            MS.instance.toggleKeybindsState();
        });

        ipcMain.handle(getFromRenderer("toggleKeybindsState"), () => {
            MS.instance.toggleKeybindsState();
        });

        ipcMain.handle(getFromRenderer("toggleOverlapSoundsState"), () => {
            MS.instance.toggleOverlapSoundsState();
        });

        ipcMain.handle(getFromRenderer("setMinToTray"), (_e, state: boolean) => {
            MS.instance.setMinToTray(state);
        });

        ipcMain.handle(getFromRenderer("addSounds"), (_e, sounds: Sound[], soundboardId: string, move: boolean, startIndex?: number) => {
            void MS.instance.soundboardsCache.addSounds(sounds, soundboardId, move, startIndex);
        });

        ipcMain.handle(getFromRenderer("editSound"), (_e, sound: Sound) => {
            void MS.instance.soundboardsCache.editSound(sound);
        });

        ipcMain.handle(getFromRenderer("deleteSound"), (_e, soundId: string) => {
            void MS.instance.soundboardsCache.removeSound(soundId);
        });

        ipcMain.handle(getFromRenderer("addSoundboard"), (_e, soundboard: Soundboard) => {
            void MS.instance.soundboardsCache.addSoundboard(soundboard);
        });

        ipcMain.handle(getFromRenderer("deleteSoundboard"), (_e, soundboardId: string) => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("editSoundboard"), (_e, soundboard: Soundboard) => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("flagChangelogViewed"), () => {
            MS.instance.flagChangelogViewed();
        });

        ipcMain.handle(getFromRenderer("moveSound"), (_e, soundId: string, destinationSoundboardId: string, destinationIndex: number) => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("moveSoundboard"), (_e, soundboardId: string, destinationIndex: number) => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("installUpdate"), () => {
            autoUpdater.quitAndInstall();
        });

        ipcMain.handle(getFromRenderer("setDeviceId"), (_e, index: number, id: string) => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("setDeviceVolume"), (_e, index: number, volume: number) => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("saveSettings"), (_e, settings: OptionalSettings) => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("minimize"), () => {
            MS.instance.windowManager.window.minimize();
        });

        ipcMain.handle(getFromRenderer("toggleMaximizedState"), () => {
            if (MS.instance.windowManager.window.isMaximized()) {
                MS.instance.windowManager.window.unmaximize();
            } else {
                MS.instance.windowManager.window.maximize();
            }
        });

        ipcMain.handle(getFromRenderer("close"), () => {
            app.quit();
        });

        ipcMain.handle(getFromRenderer("openRepo"), () => {
            void shell.openExternal("https://github.com/Tom4nt/Mega-Soundboard");
        });

        ipcMain.handle(getFromRenderer("openBugReport"), () => {
            void shell.openExternal("https://github.com/Tom4nt/Mega-Soundboard/issues/new?assignees=&labels=bug&template=bug_report.md");
        });

        ipcMain.handle(getFromRenderer("stopKeyRecordingSession"), (_e, id: string) => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("setCurrentSoundboard"), (_e, id: string) => {
            // TODO
        });

        // ---

        ipcMain.handle(getFromRenderer("getSoundsFromPaths"), (_e, paths: string[]) => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("getNewSoundboard"), () => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("browseSounds"), async () => {
            const r = await dialog.showOpenDialog({
                properties: ["openFile", "multiSelections"],
                filters: [
                    { name: "Audio files", extensions: ["mp3", "wav", "ogg"] } // TODO: Unify valid extensions
                ]
            });
            if (r.filePaths[0]) {
                return r.filePaths;
            } else {
                return null;
            }
        });

        ipcMain.handle(getFromRenderer("browseFolder"), async () => {
            const r = await dialog.showOpenDialog({
                properties: ["openDirectory"]
            });
            return r.filePaths[0];
        });

        ipcMain.handle(getFromRenderer("getValidSoundPaths"), () => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("isPathValid"), (_e, path: string, type: "sound" | "folder") => {
            // TODO
            // type === "audio/mpeg" || type === "audio/ogg" || type === "audio/wav"
        });

        ipcMain.handle(getFromRenderer("getSoundboards"), () => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("getDevices"), () => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("getInitialSelectedDevices"), () => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("shouldShowChangeLog"), () => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("getInitialSoundboardIndex"), () => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("getNameFromPath"), () => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("getSettings"), () => {
            // TODO
        });

        ipcMain.handle(getFromRenderer("getVersion"), () => {
            return app.getVersion();
        });

        ipcMain.handle(getFromRenderer("getNews"), async () => {
            return await fs.readFile(__dirname + "/../../news.html", "utf-8");
        });

        ipcMain.handle(getFromRenderer("startKeyRecordingSession"), () => {
            // TODO
        });
    }
}

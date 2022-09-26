import { app, dialog, ipcMain, shell } from "electron";
import { autoUpdater } from "electron-updater";
import { fromRender } from "../shared/ipcChannels";
import MS from "./ms";

export default class IPCHandler {
    static init(): void {

        ipcMain.on(fromRender.toggleKeybindsState, () => {
            MS.instance.toggleKeybindsState();
        });

        ipcMain.on(fromRender.windowClose, () => {
            app.quit();
        });

        ipcMain.on(fromRender.windowResize, () => {
            if (MS.instance.windowManager.window.isMaximized()) {
                MS.instance.windowManager.window.unmaximize();
            } else {
                MS.instance.windowManager.window.maximize();
            }
        });

        ipcMain.on(fromRender.windowMinimize, function () {
            MS.instance.windowManager.window.minimize();
        });

        ipcMain.on(fromRender.setMinToTray, (_e, state: boolean) => {
            MS.instance.setMinToTray(state);
        });

        ipcMain.on(fromRender.updateInstall, function () {
            autoUpdater.quitAndInstall();
        });

        // ---

        ipcMain.handle(fromRender.getVersion, () => {
            return app.getVersion();
        });

        ipcMain.handle(fromRender.openUrl, (_e, url: string) => {
            void shell.openExternal(url);
        });

        ipcMain.handle(fromRender.browseFile, async (_e, multiple: boolean, typeName: string, extensions: string[]) => {
            const r = await dialog.showOpenDialog({
                properties: multiple ? ["openFile", "multiSelections"] : ["openFile"],
                filters: [
                    {
                        name: typeName,
                        extensions: extensions
                    }
                ]
            });
            return r.filePaths;
        });

        ipcMain.handle(fromRender.browseFolder, async () => {
            const r = await dialog.showOpenDialog({
                properties: ["openDirectory"]
            });
            return r.filePaths[0];
        });

        // ipcMain.handle("sound.browse", async (e, multiple: boolean) => {
        //     const r = await dialog.showOpenDialog({
        //         properties: multiple ? ["openFile", "multiSelections"] : ["openFile"],
        //         filters: [
        //             { name: "Audio files", extensions: ["mp3", "wav", "ogg"] }
        //         ]
        //     });
        //     if (r.filePaths[0]) {
        //         return multiple ? r.filePaths : r.filePaths[0];
        //     } else {
        //         return null;
        //     }
        // });

        // ipcMain.handle("key.register", (_e, keycode: string[]) => {
        //     const id = ioHook.registerShortcut(keycode, () => {
        //         win.webContents.send("key.perform", id);
        //     });
        //     return id;
        // });

        // ipcMain.handle("key.unregister", (_e, id: number) => {
        //     ioHook.unregisterShortcut(id);
        // });
    }
}

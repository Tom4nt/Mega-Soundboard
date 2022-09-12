import { ipcRenderer } from "electron"; // TODO: Remove reference
import { promises as fs, constants as fsConst } from "fs"; // TODO: Remove reference

const savePath = ipcRenderer.sendSync("get.savePath") as string;
const dataPath = savePath + "\\Settings.json";

export default class Settings {
    minToTray = true;
    stopSoundsKeys: number[] = [];
    enableKeybinds = true;
    enableKeybindsKeys: number[] = [];
    overlapSounds = true;
    mainDevice = "default";
    secondaryDevice: string | null = null;
    mainDeviceVolume = 100;
    secondaryDeviceVolume = 100;
    selectedSoundboard = 0;
    latestLogViewed = 0;
    soundsLocation: string | null = null;

    getSoundsLocation(): string {
        if (this.soundsLocation) return this.soundsLocation;
        else return savePath + "\\Sounds";
    }

    static async load(): Promise<Settings> {
        const settings = new Settings();

        let hasAcess: boolean;
        try {
            await fs.access(dataPath, fsConst.F_OK);
            hasAcess = true;
        } catch (error) {
            hasAcess = false;
        }

        if (hasAcess) {
            const JSONtext = await fs.readFile(dataPath, "utf-8");
            const jsonData = JSON.parse(JSONtext) as Map<string, unknown>;
            Object.assign(settings, jsonData);
            // ipcRenderer.send("win.minToTray", settings.minToTray);
            // dialog.showErrorBox("Error loading settings file", "There is a syntax error in the settings file located at " + dataPath + "\n\n" + err.message +
            //     "\n\nIf you modified this file, please fix any syntax errors.");
        }
        return settings;
    }

    async save(): Promise<void> {
        const json = JSON.stringify(this, null, 2);
        await fs.writeFile(dataPath, json);
    }
}
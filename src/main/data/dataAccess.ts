import { app } from "electron";
import * as p from "path";
import Utils from "../utils/utils";
import { Settings, Sound, Soundboard } from "../../shared/models";
import { promises as fs, constants as fsc } from "fs";
import * as fsSync from "fs";
import { randomUUID } from "crypto";

const savePath = p.join(app.getPath("appData"), "\\MegaSoundboard");
const soundboardsPath = p.join(savePath, "\\Soundboards.json");
const settingsPath = p.join(savePath, "\\Settings.json");

export default class DataAccess {
    static async getSoundboardsFromSaveFile(): Promise<Soundboard[]> {
        const data = await this.readSoundboardsData();
        if (Array.isArray(data.get("soundboards"))) {
            return DataAccess.getSoundboards(data.get("soundboards") as unknown[]);
        }
        else {
            return DataAccess.getDefaultSoundboards();
        }
    }

    // TODO: Convert old static properties to new dynamic Quick Settings.
    static async getSettingsFromSaveFile(): Promise<Settings> {
        let settings = new Settings();

        const hasAcess = await Utils.isPathAccessible(settingsPath);
        if (hasAcess) {
            try {
                const JSONtext = await fs.readFile(settingsPath, "utf-8");
                const jsonObj = JSON.parse(JSONtext) as Map<string, unknown>;
                const jsonMap = Utils.objectToMap(jsonObj);
                settings = DataAccess.getSettings(jsonMap);
            } catch (error) {
                console.error(error);
            }
        }
        return settings;
    }

    static async saveSettings(settings: Settings): Promise<void> {
        const json = JSON.stringify(settings, undefined, 4);
        await fs.mkdir(savePath, { recursive: true });
        await fs.writeFile(settingsPath, json);
        console.log("Saved Settings.");
    }

    static saveSettingsSync(settings: Settings): void {
        const json = JSON.stringify(settings, undefined, 4);
        fsSync.mkdirSync(savePath, { recursive: true });
        fsSync.writeFileSync(settingsPath, json);
        console.log("Saved Settings.");
    }

    static async saveSoundboards(soundboards: Soundboard[]): Promise<void> {
        const obj = { soundboards: soundboards.map(x => Soundboard.toJSON(x)) };
        const json = JSON.stringify(obj, undefined, 4);
        await fs.mkdir(savePath, { recursive: true });
        await fs.writeFile(soundboardsPath, json);
        console.log("Saved Soundboards.");
    }

    private static async readSoundboardsData(): Promise<Map<string, unknown>> {
        let hasAcess: boolean;
        try {
            await fs.access(soundboardsPath, fsc.F_OK);
            hasAcess = true;
        } catch (error) {
            hasAcess = false;
        }

        if (hasAcess) {
            const jsonText = await fs.readFile(soundboardsPath, "utf-8");
            const jsonContents = JSON.parse(jsonText) as object;
            return Utils.objectToMap(jsonContents);

        }
        return new Map<string, unknown>();
    }

    private static getSoundboards(soundboards: unknown[]): Soundboard[] {
        const sbs: Soundboard[] = [];
        soundboards.forEach(sb => {
            if (sb && typeof sb === "object") {
                sbs.push(DataAccess.getSoundboard(Utils.objectToMap(sb)));
            }
        });
        return sbs;
    }

    private static getDefaultSoundboards(): Soundboard[] {
        const sbs = [new Soundboard(randomUUID())];
        return sbs;
    }

    private static getSoundboard(data: Map<string, unknown>): Soundboard {
        let name = "¯\\_(ツ)_/¯";
        if (typeof data.get("name") === "string") name = data.get("name") as string;

        let keys: number[] = [];
        if (Utils.isKeys(data.get("keys"))) keys = data.get("keys") as number[];

        let volume = 100;
        if (typeof data.get("volume") === "number") volume = data.get("volume") as number;

        let linkedFolder: string | null = null;
        if (typeof data.get("linkedFolder") === "string") linkedFolder = data.get("linkedFolder") as string;

        const uuid = randomUUID();

        let sounds: Sound[] = [];
        if (Array.isArray(data.get("sounds"))) {
            sounds = DataAccess.getSounds(data.get("sounds") as unknown[], uuid);
        }

        return new Soundboard(uuid, name, keys, volume, linkedFolder, sounds);
    }

    private static getSounds(data: unknown[], connectedSoundboardUuid: string): Sound[] {
        const sounds: Sound[] = [];
        data.forEach(item => {
            if (item && typeof item === "object") {
                const s = DataAccess.getSound(Utils.objectToMap(item));
                s.soundboardUuid = connectedSoundboardUuid;
                sounds.push(s);
            }
        });
        return sounds;
    }

    private static getSound(data: Map<string, unknown>): Sound {
        // Defaults
        let name = "¯\\_(ツ)_/¯";
        let path = "¯\\_(ツ)_/¯";
        let volume = 100;
        let keys: number[] = [];

        if (typeof data.get("name") === "string") name = data.get("name") as string;

        const pathRes = Utils.tryGetValue(data, ["path", "url"], v => typeof v === "string");
        if (pathRes) path = pathRes as string;

        if (typeof data.get("volume") === "number") volume = data.get("volume") as number;

        const keysRes = Utils.tryGetValue(data, ["keys", "shortcut"], v => Utils.isKeys(v));
        if (keysRes) keys = data.get("keys") as number[];

        return new Sound(randomUUID(), name, path, volume, keys);
    }

    private static getSettings(data: Map<string, unknown>): Settings {
        const settings = new Settings();
        for (const iterator of Object.keys(new Settings()) as (keyof Settings)[]) {
            const val = data.get(iterator);
            const defaultType = typeof settings[iterator];
            if (typeof val === defaultType && (Array.isArray(settings[iterator]) == Array.isArray(val))) {
                settings[iterator] = val as never;
            }
        }
        return settings;
    }
}

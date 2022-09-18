import { Sound, Soundboard } from "../shared/models";
import Utils from "./utils";
import { promises as fs, constants as fsc } from "fs";

const savePath = ""; // TODO -> ipcRenderer.sendSync("get.savePath") as string;
const dataPath = savePath + "\\Soundboards.json";

export default class LocalDataManager {
    static async getSoundboardsFromSaveFile(): Promise<Soundboard[]> {
        const data = await this.readData();
        if (Array.isArray(data.get("soundboards"))) {
            return LocalDataManager.getSoundboards(data.get("soundboards") as unknown[]);
        }
        else {
            throw Error("Could not load data from JSON save file. There must be an array named \"soundboards\" at the root.");
        }
    }

    private static async readData(): Promise<Map<string, unknown>> {
        let hasAcess: boolean;
        try {
            await fs.access(dataPath, fsc.F_OK);
            hasAcess = true;
        } catch (error) {
            hasAcess = false;
        }

        if (hasAcess) {
            const jsonText = await fs.readFile(dataPath, "utf-8");
            const jsonContents = JSON.parse(jsonText) as object;
            return Utils.objectToMap(jsonContents);

        }
        return new Map<string, unknown>();
    }

    // TODO: Save (write data)

    private static getSoundboards(soundboards: unknown[]): Soundboard[] {
        const sbs: Soundboard[] = [];
        soundboards.forEach(sb => {
            if (sb && typeof sb === "object") {
                sbs.push(LocalDataManager.getSoundboard(Utils.objectToMap(sb)));
            }
        });
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

        const sb = new Soundboard(name, keys, volume, linkedFolder, []);

        if (!linkedFolder) {
            let sounds: Sound[] = [];
            if (Array.isArray(data.get("sounds")))
                sounds = LocalDataManager.getSounds(data.get("sounds") as unknown[], sb);
            sb.sounds = sounds;
        }

        return sb;
    }

    private static getSounds(data: unknown[], connectedSoundboard: Soundboard): Sound[] {
        const sounds: Sound[] = [];
        data.forEach(sound => {
            if (sound && typeof sound === "object") {
                const s = LocalDataManager.getSound(Utils.objectToMap(sound));
                s.connectToSoundboard(connectedSoundboard);
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

        return new Sound(name, path, volume, keys);
    }
}

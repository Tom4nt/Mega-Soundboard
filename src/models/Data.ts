import { ipcRenderer } from "electron";
import Soundboard from "./Soundboard";
import { promises as fs, constants as fsConst } from "fs";

const savePath = ipcRenderer.sendSync("get.savePath") as string;
const dataPath = savePath + "\\Soundboards.json";

export default class Data {
    soundboards: Soundboard[];

    constructor() {
        this.soundboards = [];
    }

    addSoundboard(soundboard: Soundboard): void {
        this.soundboards.push(soundboard);
    }

    removeSoundboard(soundboard: Soundboard): void {
        soundboard.removeFolderListener();
        this.soundboards.splice(this.soundboards.indexOf(soundboard), 1);
    }

    static async load(): Promise<Data> {
        const data = new Data();

        let hasAcess: boolean;
        try {
            await fs.access(dataPath, fsConst.F_OK);
            hasAcess = true;
        } catch (error) {
            hasAcess = false;
        }

        if (!hasAcess) {
            const sb = new Soundboard();
            data.addSoundboard(sb);
        } else {
            const jsonText = await fs.readFile(dataPath, "utf-8");
            const jsonData = JSON.parse(jsonText) as Map<string, unknown>;
            if (Array.isArray(jsonData.get("soundboards"))) {
                data.soundboards = this.getSoundboardsFromData(jsonData.get("soundboards") as unknown[]);
            }
            else {
                throw Error("Could not load data from JSON save file. There must be an array named \"soundboards\" at the root.");
            }
        }
        return data;
    }

    static getSoundboardsFromData(soundboards: unknown[]): Soundboard[] {
        const sbs: Soundboard[] = [];
        if (!soundboards) return sbs;
        soundboards.forEach(sb => {
            if (typeof sb === "object") {
                sbs.push(Soundboard.fromSoundboardData(sb as Map<string, unknown>));
            }
        });
        return sbs;
    }

    async save(): Promise<void> {
        const data = JSON.stringify(this, null, 2);
        await fs.writeFile(dataPath, data);
        console.log("Saved.");
    }
}
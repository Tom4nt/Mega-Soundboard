import { ipcRenderer } from "electron"; // TODO: Remove reference
import { promises as fs, constants as fsConst } from "fs"; // TODO: Remove reference
import { Soundboard, Utils } from "../models";

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
            const jsonContents = JSON.parse(jsonText) as object;
            const mp = Utils.objectToMap(jsonContents);
            if (Array.isArray(mp.get("soundboards"))) {
                data.soundboards = this.getSoundboardsFromData(mp.get("soundboards") as unknown[]);
            }
            else {
                throw Error("Could not load data from JSON save file. There must be an array named \"soundboards\" at the root.");
            }
        }
        return data;
    }

    static getSoundboardsFromData(soundboards: unknown[]): Soundboard[] {
        const sbs: Soundboard[] = [];
        soundboards.forEach(sb => {
            if (sb && typeof sb === "object") {
                sbs.push(Soundboard.fromSoundboardData(Utils.objectToMap(sb)));
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
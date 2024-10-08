import { app } from "electron";
import * as p from "path";
import Utils from "../utils/utils";
import { promises as fs, constants as fsc } from "fs";
import * as fsSync from "fs";
import { Soundboard } from "./models/soundboard";
import Settings from "./models/settings";

type JSONObj = { [key: string]: unknown }

const savePath = p.join(app.getPath("appData"), "MegaSoundboard");
const soundboardsPath = p.join(savePath, "Soundboards.json");
const settingsPath = p.join(savePath, "Settings.json");

export default class DataAccess {
	static async getSoundboardsFromSaveFile(): Promise<Soundboard[]> {
		const data = await this.readSoundboardsData();
		if (Array.isArray(data["soundboards"])) {
			return DataAccess.getSoundboards(data["soundboards"] as JSONObj[]);
		}
		else {
			return DataAccess.getDefaultSoundboards();
		}
	}

	static async getSettingsFromSaveFile(): Promise<Settings> {
		let settings = new Settings();

		const hasAcess = await Utils.isPathAccessible(settingsPath);
		if (hasAcess) {
			try {
				const JSONtext = await fs.readFile(settingsPath, "utf-8");
				const jsonObj = JSON.parse(JSONtext) as JSONObj;
				settings = Settings.convert(jsonObj);
			} catch (error) {
				console.error(error);
			}
		}
		return settings;
	}

	static async saveSettings(settings: Settings): Promise<void> {
		const json = JSON.stringify(settings.getSavable(), undefined, 4);
		await fs.mkdir(savePath, { recursive: true });
		await fs.writeFile(settingsPath, json);
		console.log("Saved Settings.");
	}

	static saveSettingsSync(settings: Settings): void {
		const json = JSON.stringify(settings.getSavable(), undefined, 4);
		fsSync.mkdirSync(savePath, { recursive: true });
		fsSync.writeFileSync(settingsPath, json);
		console.log("Saved Settings.");
	}

	static async saveSoundboards(soundboards: readonly Soundboard[]): Promise<void> {
		const obj = { soundboards: soundboards.map(x => x.getSavable()) };
		const json = JSON.stringify(obj, undefined, 4);
		await fs.mkdir(savePath, { recursive: true });
		await fs.writeFile(soundboardsPath, json);
		console.log("Saved Soundboards.");
	}

	private static async readSoundboardsData(): Promise<JSONObj> {
		let hasAcess: boolean;
		try {
			await fs.access(soundboardsPath, fsc.F_OK);
			hasAcess = true;
		} catch (error) {
			void error;
			hasAcess = false;
		}

		if (hasAcess) {
			const jsonText = await fs.readFile(soundboardsPath, "utf-8");
			return JSON.parse(jsonText) as JSONObj;
		}
		return {};
	}

	private static getSoundboards(soundboards: JSONObj[]): Soundboard[] {
		const sbs: Soundboard[] = [];
		soundboards.forEach(sb => {
			sbs.push(Soundboard.convert(sb));
		});
		return sbs;
	}

	private static getDefaultSoundboards(): Soundboard[] {
		const sbs = [Soundboard.getDefault("Default")];
		return sbs;
	}
}

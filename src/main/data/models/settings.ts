import Keys from "../../../shared/keys";
import { ISettingsData } from "../../../shared/models/dataInterfaces";
import { ActionName, actionDefaults, actionNames } from "../../../shared/quickActions";
import { JSONObject } from "./interfaces";

export default class Settings {
	constructor(
		public minToTray = true,
		public mainDevice = "default",
		public secondaryDevice = "",
		public mainDeviceVolume = 1,
		public secondaryDeviceVolume = 1,
		public selectedSoundboard = 0,
		public latestLogViewed = 0,
		public showSoundDragTutorial = true,
		public soundsLocation = "",
		public pttKeys: number[] = [],
		public processKeysOnRelease = false,
		public windowSize: number[] = [],
		public windowPosition: number[] = [],
		public windowIsMaximized = false,
		public quickActionKeys = new Map<ActionName, number[]>(),
		public quickActionStates = Settings.getDefaultQuickActionStates(),
	) { }

	asData(): ISettingsData {
		return { ...this };
	}

	getSavable(): JSONObject {
		const json = {
			...this as object,
			quickActionKeys: Object.fromEntries(this.quickActionKeys),
			quickActionStates: Object.fromEntries(this.quickActionStates),
		};
		return json;
	}

	static getDefaultQuickActionStates(): Map<ActionName, boolean> {
		const map = new Map<ActionName, boolean>();
		for (const key of actionNames) {
			map.set(key, actionDefaults[key] ?? false);
		}
		return map;
	}

	static convert(data: JSONObject): Settings {
		const settings = new Settings();

		for (const iterator of Object.keys(new Settings()) as (keyof Settings)[]) {
			const val = data[iterator];
			const defaultType = typeof settings[iterator];
			if (iterator == "quickActionKeys" && typeof val === "object" && val) {
				settings.quickActionKeys = Settings.convertQuickActionKeys(val as JSONObject);
			}
			else if (iterator == "quickActionStates" && typeof val === "object" && val) {
				settings.quickActionStates = Settings.convertQuickActionStates(val as JSONObject);
			}
			else if ((iterator === "mainDeviceVolume" || iterator === "secondaryDeviceVolume") && typeof val === "number") {
				settings[iterator] = val > 1 ? val / 100 : val;
			}
			else if (typeof val === defaultType && (Array.isArray(settings[iterator]) === Array.isArray(val))) {
				settings[iterator] = val as never;
			}
		}

		Settings.migrateQuickActionStates(settings.quickActionStates, data);
		Settings.migrateQuickActionKeys(settings.quickActionKeys, data);
		return settings;
	}

	private static convertQuickActionKeys(data: JSONObject): Map<ActionName, number[]> {
		const res = new Map<ActionName, number[]>();
		for (const key of Object.keys(data)) {
			if (!actionNames.includes(key as ActionName)) continue;
			if (!Array.isArray(data[key])) continue;
			res.set(key as ActionName, data[key] as number[]);
		}
		return res;
	}

	private static convertQuickActionStates(data: JSONObject): Map<ActionName, boolean> {
		const res = new Map<ActionName, boolean>();
		for (const key of Object.keys(data)) {
			if (!actionNames.includes(key as ActionName)) continue;
			if (typeof data[key] !== "boolean") continue;
			res.set(key as ActionName, data[key]);
		}
		return res;
	}

	private static migrateQuickActionStates(current: Map<ActionName, boolean>, data: { [key: string]: unknown }): void {
		const keys = ["enableKeybinds", "overlapSounds"];
		const actionNames: ActionName[] = ["toggleKeybinds", "toggleSoundOverlap"];

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]!;
			const actionName = actionNames[i]!;
			if (typeof data[key] === "boolean")
				current.set(actionName, data[key]);
		}
	}

	private static migrateQuickActionKeys(current: Map<ActionName, number[]>, data: { [key: string]: unknown }): void {
		const keys = ["enableKeybindsKeys", "stopSoundsKeys", "randomSoundKeys"];
		const actionNames: ActionName[] = ["toggleKeybinds", "stopSounds", "playRandomSound"];

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]!;
			const actionName = actionNames[i]!;
			if (Keys.isKeys(data[key]))
				current.set(actionName, data[key]);
		}
	}
}

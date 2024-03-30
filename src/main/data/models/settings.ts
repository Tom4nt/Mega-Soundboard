import Keys from "src/shared/keys";
import { ISettingsData } from "src/shared/models/dataInterfaces";
import { ActionName, actionDefaults, actionNames } from "src/shared/quickActions";
import { JSONObject } from "./interfaces";

export default class Settings {
	constructor(
		public minToTray = true,
		public mainDevice = "default",
		public secondaryDevice = "",
		public mainDeviceVolume = 100,
		public secondaryDeviceVolume = 100,
		public selectedSoundboard = 0,
		public latestLogViewed = 0,
		public showSoundDragTutorial = true,
		public soundsLocation = "",
		public pttKeys: number[] = [],
		public processKeysOnRelease = false,
		public windowSize: number[] = [],
		public windowPosition: number[] = [],
		public windowIsMaximized: boolean = false,
		public quickActionKeys = new Map<ActionName, number[]>(),
		public quickActionStates = Settings.getDefaultQuickActionStates(),
	) { }

	asData(): ISettingsData {
		return { ...this };
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

		// TODO: Review
		for (const iterator of Object.keys(new Settings()) as (keyof Settings)[]) {
			const val = data[iterator];
			const defaultType = typeof settings[iterator];
			if (typeof val === defaultType && (Array.isArray(settings[iterator]) === Array.isArray(val))) {
				settings[iterator] = val as never;
			}
		}

		Settings.migrateQuickSettingsStates(settings.quickActionStates, data);
		Settings.migrateQuickSettingsKeys(settings.quickActionKeys, data);
		return settings;
	}

	private static migrateQuickSettingsStates(current: Map<ActionName, boolean>, data: { [key: string]: unknown }): void {
		const keys = ["enableKeybinds", "overlapSounds"];
		const actionNames: ActionName[] = ["toggleKeybinds", "toggleSoundOverlap"];

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]!;
			const actionName = actionNames[i]!;
			if (typeof data[key] === "boolean")
				current.set(actionName, data[key] as boolean);
		}
	}

	private static migrateQuickSettingsKeys(current: Map<ActionName, number[]>, data: { [key: string]: unknown }): void {
		const keys = ["enableKeybindsKeys", "stopSoundsKeys", "randomSoundKeys"];
		const actionNames: ActionName[] = ["toggleKeybinds", "stopSounds", "playRandomSound"];

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]!;
			const actionName = actionNames[i]!;
			if (Keys.isKeys(data[key]))
				current.set(actionName, data[key] as number[]);
		}
	}
}

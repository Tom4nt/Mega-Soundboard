import { Optional } from "../interfaces";
import Keys from "../keys";
import { ActionName } from "../quickActions";

export type OptionalSettings = Optional<Settings>;

// All functions must be static so instances can be passed between processes.
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
        public quickActionKeys: { [name: string]: number[] } = {},
        public quickActionStates: { [name: string]: boolean } = {},
    ) { }

    /** Utility function to get the state of a specific action as stored in the Settings. */
    static getActionState(settings: Settings, name: ActionName): boolean {
        return settings.quickActionStates[name] ?? false;
    }

    /** Utility function to get the keybind of a specific action as stored in the Settings. */
    static getActionKeys(settings: Settings, name: ActionName): number[] {
        return settings.quickActionKeys[name] ?? [];
    }
}

export function convertSettings(data: { [key: string]: unknown }): Settings {
    const settings = new Settings();

    for (const iterator of Object.keys(new Settings()) as (keyof Settings)[]) {
        const val = data[iterator];
        const defaultType = typeof settings[iterator];
        if (typeof val === defaultType && (Array.isArray(settings[iterator]) === Array.isArray(val))) {
            settings[iterator] = val as never;
        }
    }

    if (Object.keys(settings.quickActionStates).length === 0)
        settings.quickActionStates = migrateQuickSettingsStates(data);

    if (Object.keys(settings.quickActionKeys).length === 0)
        settings.quickActionKeys = migrateQuickSettingsKeys(data);

    return settings;
}

function migrateQuickSettingsStates(data: { [key: string]: unknown }): { [name: string]: boolean } {
    const res: { [name: string]: boolean } = {};

    const keys = ["enableKeybinds", "overlapSounds"];
    const actionNames: ActionName[] = ["toggleKeybinds", "toggleSoundOverlap"];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]!;
        const actionName = actionNames[i]!;
        if (typeof data[key] === "boolean")
            res[actionName] = data[key] as boolean;
    }

    return res;
}

function migrateQuickSettingsKeys(data: { [key: string]: unknown }): { [name: string]: number[] } {
    const res: { [name: string]: number[] } = {};

    const keys = ["enableKeybindsKeys", "stopSoundsKeys", "randomSoundKeys"];
    const actionNames: ActionName[] = ["toggleKeybinds", "stopSounds", "playRandomSound"];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]!;
        const actionName = actionNames[i]!;
        if (Keys.isKeys(data[key]))
            res[actionName] = data[key] as number[];
    }

    return res;
}

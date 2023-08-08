import { Optional } from "../interfaces";
import { ActionName, actions } from "../quickActions";

export type OptionalSettings = Optional<Settings>;

// All functions must be static so instances can be passed between processes.
export default class Settings {
    constructor(
        public minToTray = true,
        // public stopSoundsKeys: number[] = [],
        // public enableKeybinds = true,
        // public enableKeybindsKeys: number[] = [],
        // public overlapSounds = true,
        // public loopSounds = false,
        public mainDevice = "default",
        public secondaryDevice = "",
        public mainDeviceVolume = 100,
        public secondaryDeviceVolume = 100,
        public selectedSoundboard = 0,
        public latestLogViewed = 0,
        public soundsLocation = "",
        public pttKeys: number[] = [],
        // public randomSoundKeys: number[] = [],
        // public loopSoundsKeys: number[] = [],
        public processKeysOnRelease = false,
        public windowSize: number[] = [],
        public windowPosition: number[] = [],
        public windowIsMaximized: boolean = false,
        public quickActionKeys: { [name: string]: number[] } = {},
        public quickActionStates: { [name: string]: boolean } = {},
    ) { }

    /** Utility function to get the state of a specific action as stored in the Settings. */
    static getActionState(settings: Settings, name: ActionName): boolean {
        if (Object.keys(settings.quickActionStates).includes(name)) {
            return settings.quickActionStates[name];
        } else {
            return actions[name].default ?? false;
        }
    }

    /** Utility function to get the keybind of a specific action as stored in the Settings. */
    static getActionKeys(settings: Settings, name: ActionName): number[] {
        if (Object.keys(settings.quickActionKeys).includes(name)) {
            return settings.quickActionKeys[name];
        } else {
            return [];
        }
    }
}

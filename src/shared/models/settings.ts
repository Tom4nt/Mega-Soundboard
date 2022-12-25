import { Optional } from "../interfaces";

export type OptionalSettings = Optional<Settings>;

export default class Settings {
    constructor(
        public minToTray = true,
        public stopSoundsKeys: number[] = [],
        public enableKeybinds = true,
        public enableKeybindsKeys: number[] = [],
        public overlapSounds = true,
        public mainDevice = "default",
        public secondaryDevice: string | null = null,
        public mainDeviceVolume = 100,
        public secondaryDeviceVolume = 100,
        public selectedSoundboard = 0,
        public latestLogViewed = 0,
        public soundsLocation: string | null = null,
        public pttKeys: number[] = [],
        public randomSoundKeys: number[] = [],
    ) { }
}

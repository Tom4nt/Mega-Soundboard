export interface ISettings {
    minToTray?: boolean,
    stopSoundsKeys?: number[],
    enableKeybinds?: boolean,
    enableKeybindsKeys?: number[],
    overlapSounds?: boolean,
    mainDevice?: string,
    secondaryDevice?: string | null,
    mainDeviceVolume?: number,
    secondaryDeviceVolume?: number,
    selectedSoundboard?: number,
    latestLogViewed?: number,
    soundsLocation?: string | null,
}

export default class Settings implements ISettings {
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
        public soundsLocation: string | null = null
    ) { }
}

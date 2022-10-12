type CreateOptional<Type> = {
    [Property in keyof Type]+?: Type[Property];
};

export type OptionalSettings = CreateOptional<Settings>;

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
        public soundsLocation: string | null = null
    ) { }
}

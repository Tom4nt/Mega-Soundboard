export default class Settings {
    minToTray = true;
    stopSoundsKeys: number[] = [];
    enableKeybinds = true;
    enableKeybindsKeys: number[] = [];
    overlapSounds = true;
    mainDevice = "default";
    secondaryDevice: string | null = null;
    mainDeviceVolume = 100;
    secondaryDeviceVolume = 100;
    selectedSoundboard = 0;
    latestLogViewed = 0;
    soundsLocation: string | null = null;
}
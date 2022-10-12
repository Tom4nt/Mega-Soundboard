/* Prevents hardcoded strings for ipc communication. */

const rendererChannels = [
    "toggleKeybindsState",
    "toggleOverlapSoundsState",
    "setMinToTray",
    "getVersion",
    "browseSounds",
    "browseFolder",
    "getSoundsFromPaths",
    "getNewSoundboard",
    "getValidSoundPaths",
    "isPathValid",
    "getSoundboards",
    "getDevices",
    "getInitialSelectedDevices",
    "shouldShowChangeLog",
    "getInitialSoundboardIndex",
    "getNameFromPath",
    "getSettings",
    "getNews",
    "startKeyRecordingSession",
    "addSounds",
    "editSound",
    "deleteSound",
    "addSoundboard",
    "deleteSoundboard",
    "editSoundboard",
    "flagChangelogViewed",
    "moveSound",
    "moveSoundboard",
    "installUpdate",
    "setDeviceId",
    "setDeviceVolume",
    "saveSettings",
    "minimize",
    "toggleMaximizedState",
    "close",
    "openRepo",
    "openBugReport",
    "stopKeyRecordingSession",
    "setCurrentSoundboard",
] as const;

// const mainChannels = [
//     "keybindsStateChanged",
//     "overlapSoundsStateChanged",
//     "devicesChanged",
//     "soundAdded",
//     "soundChanged",
//     "soundRemoved",
//     "soundboardAdded",
//     "soundboardRemoved",
//     "windowStateChanged",
//     "keyRecordingProgress",
//     "currentSoundboardChanged",
//     "minToTrayChanged",
//     "updateAvailable",
//     "updateProgress",
//     "updateReady",
// ] as const;

export type RenderChannel = typeof rendererChannels[number];
// export type MainChannel = typeof mainChannels[number];

export function getFromRenderer(s: RenderChannel): string {
    return s as string;
}

// export function getFromMain(s: MainChannel): string {
//     return s as string;
// }

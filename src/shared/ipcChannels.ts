/* Prevents hardcoded strings for ipc communication. */
export const fromRender = {
    toggleKeybindsState: "toggleKeybindsState",
    setMinToTray: "setMinToTray",
    windowClose: "windowClose",
    windowMinimize: "windowMinimize",
    windowResize: "windowResize",
    getVersion: "getVersion",
    openUrl: "openUrl",
    updateInstall: "updateInstall",
    browseFile: "browseFile",
    browseFolder: "browseFolder",
};

export const fromMain = {
    soundFileAdded: "soundFileAdded",
    soundFileRemoved: "soundFileRemoved",
    minToTrayChanged: "minToTrayChanged",
    keybindsStateChanged: "keybindsStateChanged",
    overlapSoundsChanged: "overlapSoundsChanged",
    updateAvailable: "updateAvailable",
    updateProgress: "updateProgress",
    updateReady: "updateReady",
};
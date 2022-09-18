// import { ipcRenderer } from "electron"; // TODO: Remove reference.
import { Soundboard, Sound } from "../shared/models";
import { Toggler, SoundList, Slider, SoundboardList, Dropdown } from "./elements";
import { DropdownDeviceItem } from "./elements/dropdown";
import { DefaultModals, MSModal, MultiSoundModal, NewsModal, SettingsModal, SoundboardModal, SoundModal } from "./modals";
import MSR from "./msr";

const MSRi = MSR.instance;

//#region Elements

// const fileDragOverlay = document.getElementById("filedragoverlay");

//#region Left
const msbutton = document.getElementById("logo") as HTMLButtonElement;
const soundboardList = document.getElementById("soundboardlist") as SoundboardList;
const updateButton = document.getElementById("update-button") as HTMLButtonElement;
//#endregion

//#region Right
const soundList = document.getElementById("soundlist") as SoundList;
const addSoundButton = document.getElementById("add-sound-button") as HTMLButtonElement;
const addSoundboardButton = document.getElementById("button-addSoundboard") as HTMLButtonElement;
const soundlistSearchbox = document.getElementById("soundlist-searchbox") as HTMLInputElement;
const soundlistSearchboxButton = document.getElementById("soundlist-searchbox-button") as HTMLButtonElement;

//#region Action Panel
const deviceSettings = document.getElementById("devicesettings") as HTMLDivElement;
const quickSettings = document.getElementById("quicksettings") as HTMLDivElement;
const deviceSettingsButton = document.getElementById("btndevicesettings") as HTMLButtonElement;
const quickSettingsButton = document.getElementById("btnquicksettings") as HTMLButtonElement;
const stopAllButton = document.getElementById("button-stopAll") as HTMLButtonElement;

//#region Devices
const mainDeviceDropdown = deviceSettings.querySelector("#dropdown-mainDevice") as Dropdown;
const secondaryDeviceDropdown = deviceSettings.querySelector("#dropdown-secondaryDevice") as Dropdown;
const mainDeviceVolumeSlider = deviceSettings.querySelector("#slider-mainDeviceVolume") as Slider;
const secondaryDeviceVolumeSlider = deviceSettings.querySelector("#slider-secondaryDeviceVolume") as Slider;
//#endregion

//#region QuickSettings
const enabeKeybindsToggler = quickSettings.querySelector("#toggler-enableKeybinds") as Toggler;
const overlapSoundsToggler = quickSettings.querySelector("#toggler-overlapSounds") as Toggler;
const buttonMoreSettings = quickSettings.querySelector("#button-more-settings") as HTMLButtonElement;
//#endregion

//#endregion

//#endregion

//#endregion

//#region Events

window.events.onSoundAdded.addHandler(sound => {
    const soundboard = sound.connectedSoundboard;
    if (!soundboard) throw Error("A Sound cannot be added because it is not connected to a Soundboard.");

    if (MSRi.getSelectedSoundboard().equals(soundboard)) {
        void addSound(sound, soundboard);
    } else {
        soundboard.addSound(sound);
    }
});

window.events.onSoundRemoved.addHandler(sound => {
    const soundboard = sound.connectedSoundboard;
    if (!soundboard) throw Error("A Sound cannot be removed because it is not connected to a Soundboard.");

    if (MSRi.getSelectedSoundboard() === soundboard) {
        void removeSound(sound, soundboard);
    } else {
        soundboard.removeSound(sound);
    }
});

window.ondragenter = (e): void => {
    if (e.relatedTarget || MSRi.modalManager.hasOpenModal) return;
};

window.ondragleave = (e): void => {
    if (e.relatedTarget || MSRi.modalManager.hasOpenModal) return;
    soundList.endFileDrag(e);
};

window.ondragover = (e): void => {
    if (MSRi.modalManager.hasOpenModal) return;
    e.preventDefault();
    soundList.handleFileDrag(e);
};

window.ondrop = (e): void => {
    if (MSRi.modalManager.hasOpenModal) return;
    soundList.endFileDrag(e);
};

//#region Window

window.addEventListener("load", () => void init());
window.addEventListener("click", (e) => void closeActionPanelContainers(e));
window.addEventListener("contextmenu", (e) => void closeActionPanelContainers(e));

// TODO: Create element for this
window.addEventListener("load", () => {
    const btn_soundSearch = document.getElementById("soundlist-searchbox-button") as HTMLButtonElement;
    const inp_soundSearch = document.getElementById("soundlist-searchbox") as HTMLInputElement;

    btn_soundSearch.addEventListener("click", () => {
        if (inp_soundSearch.classList.contains("open")) {
            inp_soundSearch.classList.remove("open");
            inp_soundSearch.value = "";
            btn_soundSearch.innerHTML = "search";
        } else {
            inp_soundSearch.classList.add("open");
            inp_soundSearch.focus();
            btn_soundSearch.innerHTML = "close";
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.composedPath().includes(inp_soundSearch) && !e.composedPath().includes(btn_soundSearch) && inp_soundSearch.value == "") {
            inp_soundSearch.classList.remove("open");
            inp_soundSearch.value = "";
            btn_soundSearch.innerHTML = "search";
        }
    });
});

//#endregion

//#region Left

msbutton.addEventListener("click", () => {
    new MSModal().open();
});

addSoundboardButton.addEventListener("click", () => {
    const modal = new SoundboardModal(null);
    modal.open();
    modal.onSaved.addHandler(soundboard => {
        /// TODO: Send "addSoundboard" event to preload
        // soundboardList.addSoundboard(soundboard);
        // void KeybindManager.instance.registerSoundboardn(soundboard);
        // MS.instance.data.addSoundboard(soundboard);
        // void MS.instance.data.save();
    });
});

updateButton.addEventListener("click", () => {
    // ipcRenderer.send("update.perform");
});

soundboardList.onSelectSoundboard.addHandler((soundboard) => {
    void selectSoundboard(soundboard);
});

//#endregion

//#region Right

addSoundButton.addEventListener("click", () => void addNewSounds());

soundlistSearchbox.addEventListener("input", () => {
    soundList.filter = soundlistSearchbox.value;
});

soundlistSearchboxButton.addEventListener("click", () => {
    if (soundlistSearchbox.value) {
        soundList.filter = "";
    }
});

// TODO: Changing soundboards when a sound is dragged on top of the respecive button - This should be handled by the soundboard list.
// soundList.addEventListener("soundboardselect", (e) => {
//     if (MS.instance.getSelectedSoundboard() === e.detail.soundboard) return;
//     soundboardList.selectSoundboard(e.detail.soundboard);
// });

// TODO: Handle reorder.
// soundList.addEventListener("reorder", (e) => {
//     const sound = e.detail.sound;
//     const oldSB = e.detail.oldSoundboard;
//     const newSB = e.detail.newSoundboard;
//     if (oldSB === newSB) return;

//     if (sound.isPlaying()) {
//         soundboardList.incrementPlayingSound(oldSB, -1);
//         soundboardList.incrementPlayingSound(newSB, 1);
//     }
// });

//#endregion

//#region Action Panel

stopAllButton.addEventListener("click", () => {
    MSRi.audioManager.stopAllSounds();
});

deviceSettingsButton.addEventListener("click", () => {
    deviceSettings.classList.toggle("closed");
});

quickSettingsButton.addEventListener("click", () => {
    quickSettings.classList.toggle("closed");
});

overlapSoundsToggler.onToggle.addHandler((t) => {
    // ipcRenderer.send("settings.overlapSounds", t.isOn);
    void setOverlapSoundsSettings(t.isOn);
});

mainDeviceVolumeSlider.onValueChange.addHandler(s => {
    // TODO: Send via preload
    // return MSRi.settings.mainDeviceVolume = s.value;
});
secondaryDeviceVolumeSlider.onValueChange.addHandler(s => {
    // TODO: Send via preload
    // return MSRi.settings.secondaryDeviceVolume = s.value;
});

mainDeviceDropdown.onSelectedItem.addHandler(item => {
    // if (item instanceof DropdownDeviceItem)
    // TODO: Send via preload
    // MS.instance.settings.mainDevice = item.device ?? "default";
});

secondaryDeviceDropdown.onSelectedItem.addHandler(item => {
    // if (item instanceof DropdownDeviceItem)
    // TODO: Send via preload
    // MS.instance.settings.secondaryDevice = item.device;
});

enabeKeybindsToggler.onToggle.addHandler((t) => {
    // ipcRenderer.send("settings.enableKeybinds", t.isOn);
    void setKeybindsToggleSettings(t.isOn);
});

buttonMoreSettings.addEventListener("click", () => {
    quickSettings.classList.add("closed");
    new SettingsModal().open();
});

//#endregion

//#endregion

//#region Functions

async function init(): Promise<void> {
    // TODO: Listen to preload event for this
    // MS.instance.onToggleKeybindsState.addHandler(() => {
    //     enabeKeybindsToggler.isOn = MS.instance.settings.enableKeybinds;
    // });

    // TODO: Listen to preload event
    // KeybindManager.instance.onSelectSoundboard.addHandler((soundboard) => {
    //     soundboardList.select(soundboard);
    // });

    // fillDeviceLists(MS.instance.devices); // TODO: Get devices from preload and select them in the dropdowns
    // mainDeviceDropdown.selectIfFound((item) => item instanceof DropdownDeviceItem && item.device === MS.instance.settings.mainDevice);
    // secondaryDeviceDropdown.selectIfFound((item) => item instanceof DropdownDeviceItem && item.device === MS.instance.settings.secondaryDevice);

    // TODO: Get all soundboards from preload and fill the list
    // for (const soundboard of MS.instance.data.soundboards) {
    //     void KeybindManager.instance.registerSoundboardn(soundboard);
    //     soundboardList.addSoundboard(soundboard);
    // }

    //Select saved soundboard ID
    // TODO: Get from preload
    // soundboardList.selectSoundboardAt(MS.instance.settings.selectedSoundboard);

    // Send quick settings states to main // TODO: Manage in the main process
    // ipcRenderer.send("settings.enableKeybinds", enabeKeybindsToggler.isOn);
    // ipcRenderer.send("settings.overlapSounds", overlapSoundsToggler.isOn);

    // Register global settings keybinds // TODO: Move to main
    // await KeybindManager.instance.registerAction(MS.instance.settings.stopSoundsKeys, () => MS.instance.stopAllSounds(), "stop-sounds");
    // await KeybindManager.instance.registerAction(MS.instance.settings.enableKeybindsKeys, () => MS.instance.toggleKeybindsState(), "toggle-keybinds-state");

    // TODO: Make "shouldShowChangelog" preload event
    const shouldShowChangelog = false; // MS.latestWithLog > MS.instance.settings.latestLogViewed && MS.instance.settings.latestLogViewed >= 0;
    if (shouldShowChangelog) {
        const modal = await NewsModal.load();
        modal.open();
        // MS.instance.settings.latestLogViewed = MS.latestWithLog;
        // await MS.instance.settings.save();
        // TODO: Flag "logShown" (preload)
    }

    // TODO: Buttons should handle their own popups.
    // MS.addPopup("Add Sound(s)", addSoundButton, "left");
    // MS.addPopup("Add Soundboard", addSoundboardButton, "left");
    // MS.addPopup("Audio Devices", deviceSettingsButton);
    // MS.addPopup("Quick Settings", quickSettingsButton);
    // MS.addPopup("Stop all</br>Sounds", stopAllButton);
    // MS.addPopup("Restart and Update", updateButton, "right");
}

async function addNewSounds(): Promise<void> {
    const currentSBLinkedFolder = MSRi.getSelectedSoundboard().linkedFolder;
    if (!currentSBLinkedFolder) {
        // TODO: Get files from preloader
        const files = await Promise.resolve([] as string[]); // await ipcRenderer.invoke("file.browse", true, "Audio files", ["mp3", "wav", "ogg"]) as string[];

        const sb = MSRi.getSelectedSoundboard();

        if (files.length == 1) {
            const soundPath = files[0];

            // TODO: "getSoundForFile" event
            // const newSound = new Sound(Utils.getNameFromFile(soundPath), soundPath, 100, []);
            const newSound = new Sound("", soundPath, 100, []);

            newSound.connectToSoundboard(sb);
            const modal = new SoundModal(newSound);
            modal.open();
            modal.onSave.addHandler(async sound => {
                // await addSound(sound, sb);
                // TODO: Add via preload
                // await MS.instance.data.save();
            });

        } else {
            const multiSoundModal = new MultiSoundModal(files);
            multiSoundModal.open();
            multiSoundModal.onAdded.addHandler(sounds => {
                for (const sound of sounds) {
                    sound.connectToSoundboard(sb);
                    // tasks.push(addSound(sound, sb));
                }
                // TODO: Single preload event to add all sounds.
                // await Promise.all([...tasks, MS.instance.data.save()]);
            });
        }

    } else {
        DefaultModals.errSoundboardIsLinked(currentSBLinkedFolder).open();
    }
}

//#region Devices

function fillDeviceLists(devices: MediaDeviceInfo[]): void {
    secondaryDeviceDropdown.addItem(new DropdownDeviceItem("None", null));
    for (const device of devices) {
        if (device.deviceId === "default") {
            mainDeviceDropdown.addItem(new DropdownDeviceItem("Default", "default"));
            secondaryDeviceDropdown.addItem(new DropdownDeviceItem("Default", "default"));
        } else {
            mainDeviceDropdown.addItem(new DropdownDeviceItem(device.label, device.deviceId));
            secondaryDeviceDropdown.addItem(new DropdownDeviceItem(device.label, device.deviceId));
        }
    }
}

//#endregion

function selectSoundboard(soundboard: Soundboard): void {
    // TODO: Send "selectSoundboard" event to preload
    // TODO: Get sounds to load to the list via preload

    // const currSB = MSRi.getSelectedSoundboard();
    // setSoundlistSounds(soundboard);
    // const tasks: Promise<void>[] = [];
    // tasks.push(KeybindManager.instance.unregisterSounds(currSB));
    // MS.instance.setSelectedSoundboard(soundboard);
    // for (const sound of soundboard.sounds) {
    // tasks.push(KeybindManager.instance.registerSound(sound));
    // }
    // tasks.push(MS.instance.settings.save());
    // await Promise.all(tasks);
}

function setSoundlistSounds(soundboard: Soundboard): void {
    soundList.setSounds(soundboard.sounds);
    soundList.canAdd = !soundboard.linkedFolder;
}

async function setKeybindsToggleSettings(state: boolean): Promise<void> {
    // MS.instance.settings.enableKeybinds = state;
    // await MS.instance.settings.save();
    // TODO: Send to preload
}

async function setOverlapSoundsSettings(state: boolean): Promise<void> {
    // MS.instance.settings.overlapSounds = state;
    // await MS.instance.settings.save();
    // TODO: Send to preload
}

function closeActionPanelContainers(e: MouseEvent): void {
    if (!e.composedPath().includes(deviceSettings) && e.target != deviceSettingsButton && !deviceSettings.classList.contains("closed")) {
        deviceSettings.classList.add("closed");
    }
    if (!e.composedPath().includes(quickSettings) && e.target != quickSettingsButton && !quickSettings.classList.contains("closed")) {
        quickSettings.classList.add("closed");
    }
}

/** Adds a sound to the selected soundboard in the sound list and data. Registers keybinds. */
async function addSound(sound: Sound, soundboard: Soundboard, index?: number): Promise<void> {
    // soundList.addSound(sound, index);
    // soundboard.addSound(sound, index);
    // await KeybindManager.instance.registerSound(sound);
    // TODO: Send event to preload.
}

async function removeSound(sound: Sound, soundboard: Soundboard): Promise<void> {
    // soundList.removeSound(sound);
    // MSRi.audioManager.stopSound(sound.path);
    // soundboard.removeSound(sound);
    // await KeybindManager.instance.unregisterSound(sound);
    // TODO: Send event to preload.
}

//#endregion

//#region Main Events

// ipcRenderer.on("update.available", function () {
//     updateButton.updateReady = false;
//     updateButton.style.display = "inline-block";
//     updateButton.classList.add("downloading");
//     updateButton.classList.remove("update");
//     updateButton.firstElementChild.firstElementChild.innerHTML = "Downloading Update";
//     updateButton.firstElementChild.style.width = "0%";
// });

// ipcRenderer.on("update.progress", function (e, progress: number) {
//     if (updateButton.firstElementChild instanceof HTMLElement)
//         updateButton.firstElementChild.style.width = `${progress}%`;
// });

// ipcRenderer.on("update.ready", function () {
//     updateButton.style.display = "inherit";
//     console.log("READY TO UPDATE");
// });

// ipcRenderer.on("settings.overlapSounds", function (e, state: boolean) {
//     overlapSoundsToggler.isOn = state;
//     void setOverlapSoundsSettings(state);
// });

// ipcRenderer.on("settings.enableKeybinds", function (e, state: boolean) {
//     enabeKeybindsToggler.isOn = state;
//     void setKeybindsToggleSettings(state);
// });

// ipcRenderer.on("win.focus", () => {
//     document.body.classList.add("focused");
// });

// ipcRenderer.on("win.blur", () => {
//     document.body.classList.remove("focused");
// });

//#endregion
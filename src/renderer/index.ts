import Actions from "./util/actions";
import { Toggler, SoundList, Slider, SoundboardList, Dropdown, SearchBox } from "./elements";
import { DropdownDeviceItem } from "./elements/dropdown";
import { DefaultModals, MSModal, NewsModal, SettingsModal, SoundboardModal } from "./modals";
import MSR from "./msr";
import Utils from "./util/utils";

const MSRi = MSR.instance;

//#region Elements

// const fileDragOverlay = document.getElementById("filedragoverlay");

//#region Left
const msbutton = document.getElementById("logo") as HTMLButtonElement;
const soundboardList = document.getElementById("soundboardlist") as SoundboardList;
const updateButton = document.getElementById("update-button") as HTMLButtonElement;
//#endregion

//#region Right
const searchBox = document.getElementById("searchbox") as SearchBox;
const soundList = document.getElementById("soundlist") as SoundList;
const addSoundButton = document.getElementById("add-sound-button") as HTMLButtonElement;
const addSoundboardButton = document.getElementById("button-addSoundboard") as HTMLButtonElement;

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

window.ondragleave = (e): void => {
    if (e.relatedTarget || MSRi.modalManager.hasOpenModal) return;
    soundList.stopDrag();
};

window.ondragstart = async (e): Promise<void> => {
    if (MSRi.modalManager.hasOpenModal) return;
    e.preventDefault();

    if (!e.dataTransfer || e.dataTransfer.items.length < 1) return;

    const paths = Utils.getDataTransferFilePaths(e.dataTransfer);
    const validPaths = await window.functions.getValidSoundPaths(paths);

    if (validPaths.length <= 0) return;
    soundList.startDrag();
};

window.ondrop = async (e): Promise<void> => {
    if (MSRi.modalManager.hasOpenModal || !e.dataTransfer) return;
    const filePaths = Utils.getDataTransferFilePaths(e.dataTransfer);

    const validPaths = await window.functions.getValidSoundPaths(filePaths);
    if (validPaths.length < 1) return;

    const currentSoundboard = soundboardList.getSelectedSoundboard();
    if (!currentSoundboard) return;

    if (currentSoundboard.linkedFolder) {
        DefaultModals.errSoundboardIsLinked(currentSoundboard.linkedFolder).open();
        return;
    }

    const index = soundList.stopDrag(); // Use this index to insert the Sound at the correct position in the list.
    await Actions.addSounds(validPaths, currentSoundboard.uuid, index);
};

//#region Window

window.addEventListener("load", () => void init());
window.addEventListener("click", (e) => void closeActionPanelContainers(e));
window.addEventListener("contextmenu", (e) => void closeActionPanelContainers(e));

//#endregion

msbutton.addEventListener("click", () => {
    new MSModal().open();
});

addSoundboardButton.addEventListener("click", () => {
    const modal = new SoundboardModal();
    modal.open();
    modal.onSaved.addHandler(soundboard => {
        window.actions.addSoundboard(soundboard);
    });
});

updateButton.addEventListener("click", () => {
    window.actions.installUpdate();
});

addSoundButton.addEventListener("click", () => {
    void browseAndAddSounds();
});

searchBox.onInput.addHandler(v => {
    soundList.filter(v);
});

searchBox.onButtonClick.addHandler(() => {
    soundList.filter("");
});

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

overlapSoundsToggler.onToggle.addHandler(() => {
    window.actions.toggleOverlapSoundsState();
});

mainDeviceVolumeSlider.onValueChange.addHandler(s => {
    window.actions.setDeviceVolume(0, s.value);
});

secondaryDeviceVolumeSlider.onValueChange.addHandler(s => {
    window.actions.setDeviceVolume(1, s.value);
});

mainDeviceDropdown.onSelectedItem.addHandler(item => {
    if (item instanceof DropdownDeviceItem && item.device)
        window.actions.setDeviceId(0, item.device);
});

secondaryDeviceDropdown.onSelectedItem.addHandler(item => {
    if (item instanceof DropdownDeviceItem && item.device)
        window.actions.setDeviceId(1, item.device);
});

enabeKeybindsToggler.onToggle.addHandler(() => {
    window.actions.toggleKeybinsState();
});

buttonMoreSettings.addEventListener("click", () => {
    quickSettings.classList.add("closed");
    new SettingsModal().open();
});

//#endregion

//#endregion

//#region Functions

async function init(): Promise<void> {
    const devices = await window.functions.getDevices();
    fillDeviceLists(devices);

    const initialDevices = await window.functions.getInitialSelectedDevices();
    if (initialDevices.length > 0)
        mainDeviceDropdown.selectIfFound((item) => item instanceof DropdownDeviceItem && item.device === initialDevices[0].deviceId);
    if (initialDevices.length > 1)
        secondaryDeviceDropdown.selectIfFound((item) => item instanceof DropdownDeviceItem && item.device === initialDevices[1].deviceId);

    const soundboards = await window.functions.getSoundboards();
    for (const sb of soundboards) {
        soundboardList.addSoundboard(sb);
    }

    enabeKeybindsToggler.isOn = await window.functions.areKeysEnabled();
    overlapSoundsToggler.isOn = await window.functions.isSoundOverlapEnabled();

    window.events.onStopAllSounds.addHandler(() => MSRi.audioManager.stopAllSounds());
    window.events.onKeybindsStateChanged.addHandler((state) => enabeKeybindsToggler.isOn = state);

    const shouldShowChangelog = await window.functions.shouldShowChangelog();
    if (shouldShowChangelog) {
        const modal = await NewsModal.load();
        modal.open();
        window.actions.flagChangelogViewed();
    }
}

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

function closeActionPanelContainers(e: MouseEvent): void {
    if (!e.composedPath().includes(deviceSettings) && e.target != deviceSettingsButton && !deviceSettings.classList.contains("closed")) {
        deviceSettings.classList.add("closed");
    }
    if (!e.composedPath().includes(quickSettings) && e.target != quickSettingsButton && !quickSettings.classList.contains("closed")) {
        quickSettings.classList.add("closed");
    }
}

async function browseAndAddSounds(): Promise<void> {
    const paths = await window.functions.browseSounds();
    const sb = soundboardList.getSelectedSoundboard();
    if (sb) void Actions.addSounds(paths, sb.uuid);
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

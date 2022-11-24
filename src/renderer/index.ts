import Actions from "./util/actions";
import { Toggler, SoundList, Slider, SoundboardList, Dropdown, SearchBox } from "./elements";
import { DropdownDeviceItem } from "./elements/dropdown";
import { DefaultModals, MSModal, NewsModal, SettingsModal } from "./modals";
import MSR from "./msr";
import Utils from "./util/utils";
import AudioManager from "./audioManager";
import { Settings } from "../shared/models";

const MSRi = MSR.instance;

//#region Elements

// const fileDragOverlay = document.getElementById("filedragoverlay");

//#region Left
let msbutton!: HTMLButtonElement;
let soundboardList!: SoundboardList;
let updateButton!: HTMLButtonElement;
//#endregion

//#region Right
let searchBox!: SearchBox;
let soundList!: SoundList;
let addSoundButton!: HTMLButtonElement;
let addSoundboardButton!: HTMLButtonElement;

//#region Action Panel
let deviceSettings!: HTMLDivElement;
let quickSettings!: HTMLDivElement;
let deviceSettingsButton!: HTMLButtonElement;
let quickSettingsButton!: HTMLButtonElement;
let stopAllButton!: HTMLButtonElement;

//#region Devices
let mainDeviceDropdown!: Dropdown;
let secondaryDeviceDropdown!: Dropdown;
let mainDeviceVolumeSlider!: Slider;
let secondaryDeviceVolumeSlider!: Slider;
//#endregion

//#region QuickSettings
let enabeKeybindsToggler!: Toggler;
let overlapSoundsToggler!: Toggler;
let buttonMoreSettings!: HTMLButtonElement;
//#endregion

//#endregion

//#endregion

//#endregion

window.ondragleave = (e): void => {
    if (e.relatedTarget || MSRi.modalManager.hasOpenModal) return;
    soundList.hideDragDummy();
};

window.ondragstart = async (e): Promise<void> => {
    if (MSRi.modalManager.hasOpenModal) return;
    // e.preventDefault();

    if (!e.dataTransfer || e.dataTransfer.items.length < 1) return;

    const paths = Utils.getDataTransferFilePaths(e.dataTransfer);
    const validPaths = await window.actions.getValidSoundPaths(paths);

    if (validPaths.length <= 0) return;
    soundList.showDragDummy();
};

window.ondrop = async (e): Promise<void> => {
    if (MSRi.modalManager.hasOpenModal || !e.dataTransfer) return;
    const filePaths = Utils.getDataTransferFilePaths(e.dataTransfer);

    const validPaths = await window.actions.getValidSoundPaths(filePaths);
    if (validPaths.length < 1) return;

    const currentSoundboard = soundboardList.getSelectedSoundboard();
    if (!currentSoundboard) return;

    if (currentSoundboard.linkedFolder) {
        DefaultModals.errSoundboardIsLinked(currentSoundboard.linkedFolder).open();
        return;
    }

    const index = soundList.hideDragDummy(); // Use this index to insert the Sound at the correct position in the list.
    await Actions.addSounds(validPaths, currentSoundboard.uuid, index);
};

window.addEventListener("load", () => void init());
window.addEventListener("click", (e) => void closeActionPanelContainers(e));
window.addEventListener("contextmenu", (e) => void closeActionPanelContainers(e));

//#region Functions

async function init(): Promise<void> {
    getElementReferences();
    addElementListeners();

    await loadDevicesPanel();

    const soundboards = await window.actions.getSoundboards();
    for (const sb of soundboards) {
        soundboardList.addSoundboard(sb);
    }

    window.events.onKeybindsStateChanged.addHandler(state => enabeKeybindsToggler.isOn = state);
    window.events.onOverlapSoundsStateChanged.addHandler(state => overlapSoundsToggler.isOn = state);

    const shouldShowChangelog = await window.actions.shouldShowChangelog();
    if (shouldShowChangelog) {
        const modal = await NewsModal.load();
        modal.open();
        window.actions.flagChangelogViewed();
    }

    window.actions.notifyContentLoaded();
}

async function loadDevicesPanel(): Promise<void> {
    const devices = await AudioManager.getAudioDevices();
    loadDevices(devices);

    const settings = await window.actions.getSettings();
    selectDevices(settings);
    setVolumes(settings);
}

function selectDevices(settings: Settings): void {
    mainDeviceDropdown.selectIfFound(item =>
        item instanceof DropdownDeviceItem && item.device === settings.mainDevice);

    if (settings.secondaryDevice !== null)
        secondaryDeviceDropdown.selectIfFound(item =>
            item instanceof DropdownDeviceItem && item.device === settings.secondaryDevice);
}

function setVolumes(settings: Settings): void {
    mainDeviceVolumeSlider.value = settings.mainDeviceVolume;
    secondaryDeviceVolumeSlider.value = settings.secondaryDeviceVolume;
}

function getElementReferences(): void {
    msbutton = document.getElementById("logo") as HTMLButtonElement;
    soundboardList = document.getElementById("soundboardlist") as SoundboardList;
    updateButton = document.getElementById("update-button") as HTMLButtonElement;

    searchBox = document.getElementById("searchbox") as SearchBox;
    soundList = document.getElementById("soundlist") as SoundList;
    addSoundButton = document.getElementById("add-sound-button") as HTMLButtonElement;
    addSoundboardButton = document.getElementById("button-addSoundboard") as HTMLButtonElement;

    deviceSettings = document.getElementById("devicesettings") as HTMLDivElement;
    quickSettings = document.getElementById("quicksettings") as HTMLDivElement;
    deviceSettingsButton = document.getElementById("btndevicesettings") as HTMLButtonElement;
    quickSettingsButton = document.getElementById("btnquicksettings") as HTMLButtonElement;
    stopAllButton = document.getElementById("button-stopAll") as HTMLButtonElement;

    mainDeviceDropdown = deviceSettings.querySelector("#dropdown-mainDevice") as Dropdown;
    secondaryDeviceDropdown = deviceSettings.querySelector("#dropdown-secondaryDevice") as Dropdown;
    mainDeviceVolumeSlider = deviceSettings.querySelector("#slider-mainDeviceVolume") as Slider;
    secondaryDeviceVolumeSlider = deviceSettings.querySelector("#slider-secondaryDeviceVolume") as Slider;

    enabeKeybindsToggler = quickSettings.querySelector("#toggler-enableKeybinds") as Toggler;
    overlapSoundsToggler = quickSettings.querySelector("#toggler-overlapSounds") as Toggler;
    buttonMoreSettings = quickSettings.querySelector("#button-more-settings") as HTMLButtonElement;
}

function addElementListeners(): void {
    msbutton.addEventListener("click", () => {
        new MSModal().open();
    });

    addSoundboardButton.addEventListener("click", () => {
        void Actions.addSoundboard();
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

    // TODO: Fix devices and volumes not being set.
    mainDeviceVolumeSlider.onValueChange.addHandler(s => {
        window.actions.setDeviceVolume(0, s.value);
        // MSRi.audioManager.devices[0].volume = s.value;
    });

    secondaryDeviceVolumeSlider.onValueChange.addHandler(s => {
        window.actions.setDeviceVolume(1, s.value);
        // MSRi.audioManager.devices[1].volume = s.value;
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
        window.actions.toggleKeybindsState();
    });

    buttonMoreSettings.addEventListener("click", () => {
        quickSettings.classList.add("closed");
        new SettingsModal().open();
    });

    //#endregion
}

function loadDevices(devices: MediaDeviceInfo[]): void {
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
    const paths = await window.actions.browseSounds();
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

window.events.onWindowFocusChanged.addHandler(s => {
    if (s) document.body.classList.add("focused");
    else document.body.classList.remove("focused");
});

//#endregion

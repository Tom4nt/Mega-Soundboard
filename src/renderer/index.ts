import Actions from "./util/actions";
import { Toggler, SoundList, Slider, SoundboardList, Dropdown, SearchBox } from "./elements";
import { DropdownDeviceItem } from "./elements/dropdown";
import { DefaultModals, MSModal, NewsModal, SettingsModal } from "./modals";
import MSR from "./msr";
import { Settings } from "../shared/models";
import AudioManager from "./audioManager";
import GlobalEvents from "./util/globalEvents";

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

window.addEventListener("load", () => void init());
window.addEventListener("click", (e) => void closeActionPanelContainers(e));
window.addEventListener("contextmenu", (e) => void closeActionPanelContainers(e));

//#region Functions

async function init(): Promise<void> {
    const content = window.getInitialContent();

    getElementReferences();
    addElementListeners();

    const devices = await AudioManager.getAudioDevices();
    loadDevicesPanel(devices, content.settings);

    const soundboards = content.soundboards;
    for (const sb of soundboards) {
        soundboardList.addSoundboard(sb);
    }

    enabeKeybindsToggler.isOn = content.settings.enableKeybinds;
    overlapSoundsToggler.isOn = content.settings.overlapSounds;

    GlobalEvents.addHandler("onKeybindsStateChanged", state => enabeKeybindsToggler.isOn = state);
    GlobalEvents.addHandler("onOverlapSoundsStateChanged", state => overlapSoundsToggler.isOn = state);

    const shouldShowChangelog = content.shouldShowChangelog;
    if (shouldShowChangelog) {
        const modal = await NewsModal.load();
        modal.open();
        window.actions.flagChangelogViewed();
    }

    const sb = soundboards[content.settings.selectedSoundboard];
    soundList.loadSounds(sb.sounds, sb.uuid, sb.linkedFolder === null);
    soundboardList.selectSoundboard(sb);
}

function loadDevicesPanel(devices: MediaDeviceInfo[], settings: Settings): void {
    loadDevices(devices);
    selectDevices(settings);
    setVolumes(settings);
}

function selectDevices(settings: Settings): void {
    mainDeviceDropdown.selectIfFound(item =>
        item instanceof DropdownDeviceItem && item.device === settings.mainDevice);

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
        MSR.instance.audioManager.stopAllSounds();
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
        window.actions.setMainDevice(undefined, s.value);
    });

    secondaryDeviceVolumeSlider.onValueChange.addHandler(s => {
        window.actions.setSecondaryDevice(undefined, s.value);
    });

    mainDeviceDropdown.onSelectedItem.addHandler(item => {
        if (item instanceof DropdownDeviceItem && item.device)
            window.actions.setMainDevice(item.device);
    });

    secondaryDeviceDropdown.onSelectedItem.addHandler(item => {
        if (item instanceof DropdownDeviceItem)
            window.actions.setSecondaryDevice(item.device);
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
    const sb = soundboardList.getSelectedSoundboard();
    if (sb) {
        if (sb.linkedFolder === null) {
            const paths = await window.actions.browseSounds();
            await Actions.addSounds(paths, sb.uuid);
        } else
            DefaultModals.errSoundboardIsLinked(sb.linkedFolder).open();
    }
}

//#endregion

//#region Main Events

// window.events.onUpdateAvailable.addHandler(() => {
//     // updateButton.updateReady = false;
//     updateButton.style.display = "inline-block";
//     updateButton.classList.add("downloading");
//     updateButton.classList.remove("update");
//     if (updateButton.firstElementChild?.firstElementChild) {
//         updateButton.firstElementChild.firstElementChild.innerHTML = "Downloading Update";
//         if (updateButton.firstElementChild instanceof HTMLElement)
//             updateButton.firstElementChild.style.width = "0%";
//     }
// });

// window.events.onUpdateProgress.addHandler(progress => {
//     if (updateButton.firstElementChild instanceof HTMLElement)
//         updateButton.firstElementChild.style.width = `${progress}%`;
// });

GlobalEvents.addHandler("onUpdateReady", () => {
    updateButton.style.display = "inherit";
    console.log("READY TO UPDATE");
});

GlobalEvents.addHandler("onWindowFocusChanged", s => {
    if (s) document.body.classList.add("focused");
    else document.body.classList.remove("focused");
});

//#endregion

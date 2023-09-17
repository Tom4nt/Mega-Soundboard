import Actions from "./util/actions";
import { Toggler, SoundList, Slider, SoundboardList, Dropdown, SearchBox, Seekbar, MessageHost, Tooltip, Draggable, SoundItem, FileDropArea } from "./elements";
import { DropdownDeviceItem } from "./elements/dropdown";
import { DefaultModals, MSModal, NewsModal, SettingsModal } from "./modals";
import MSR from "./msr";
import { Message, Settings } from "../shared/models";
import AudioManager from "./audioManager";
import GlobalEvents from "./util/globalEvents";
import * as MessageQueue from "./messageQueue";
import Utils from "./util/utils";

//#region Elements

let messageHost!: MessageHost;

//#region Left
let msbutton!: HTMLButtonElement;
let soundboardList!: SoundboardList;
let updateButton!: HTMLButtonElement;
let addSoundboardButton!: HTMLButtonElement;
let addSoundboardDropArea !: FileDropArea;
//#endregion

//#region Right
let searchBox!: SearchBox;
let soundList!: SoundList;
let addSoundButton!: HTMLButtonElement;
let sortButton!: HTMLButtonElement;

//#region Action Panel
let deviceSettings!: HTMLDivElement;
let quickSettings!: HTMLDivElement;
let deviceSettingsButton!: HTMLButtonElement;
let quickSettingsButton!: HTMLButtonElement;
let randomSoundButton!: HTMLButtonElement;
let stopAllButton!: HTMLButtonElement;
let seekbar!: Seekbar;

//#region Devices
let mainDeviceDropdown!: Dropdown;
let secondaryDeviceDropdown!: Dropdown;
let mainDeviceVolumeSlider!: Slider;
let secondaryDeviceVolumeSlider!: Slider;
//#endregion

//#region QuickSettings
let enabeKeybindsToggler!: Toggler;
let overlapSoundsToggler!: Toggler;
let loopSoundsToggler!: Toggler;
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

    MessageQueue.setHost(messageHost);

    const devices = await AudioManager.getAudioDevices();
    loadDevicesPanel(devices, content.settings);

    const soundboards = content.soundboards;
    for (const sb of soundboards) {
        soundboardList.addSoundboard(sb);
    }

    enabeKeybindsToggler.isOn = Settings.getActionState(content.settings, "toggleKeybinds");
    overlapSoundsToggler.isOn = Settings.getActionState(content.settings, "toggleSoundOverlap");
    loopSoundsToggler.isOn = Settings.getActionState(content.settings, "toggleSoundLooping");

    GlobalEvents.addHandler("onKeybindsStateChanged", state => enabeKeybindsToggler.isOn = state);
    GlobalEvents.addHandler("onOverlapSoundsStateChanged", state => overlapSoundsToggler.isOn = state);
    GlobalEvents.addHandler("onLoopSoundsChanged", state => loopSoundsToggler.isOn = state);

    const shouldShowChangelog = content.shouldShowChangelog;
    if (shouldShowChangelog) {
        const modal = await NewsModal.load();
        modal.open();
        window.actions.flagChangelogViewed();
    }

    const sb = soundboards[content.settings.selectedSoundboard];
    if (sb) {
        soundList.loadSounds(sb.sounds, sb.uuid, sb.linkedFolder === null);
        soundboardList.selectSoundboard(sb);
    }

    MSR.instance.audioManager.onSingleInstanceChanged.addHandler(audioInst => {
        seekbar.currentInstance = audioInst;
    });
}

function loadDevicesPanel(devices: MediaDeviceInfo[], settings: Settings): void {
    loadDevices(devices);
    selectDevices(settings);
    setVolumes(settings);
}

function selectDevices(settings: Settings): void {
    const foundMain = mainDeviceDropdown.selectIfFound(item =>
        item instanceof DropdownDeviceItem && item.device === settings.mainDevice);

    // If main device not found, load Default.
    if (!foundMain) mainDeviceDropdown.selectIfFound(item =>
        item instanceof DropdownDeviceItem && item.device == "default");

    const foundSecondary = secondaryDeviceDropdown.selectIfFound(item =>
        item instanceof DropdownDeviceItem && item.device === settings.secondaryDevice);

    // If secondary device not found, load None.
    if (!foundSecondary) secondaryDeviceDropdown.selectIfFound(item =>
        item instanceof DropdownDeviceItem && item.device === "");
}

function setVolumes(settings: Settings): void {
    mainDeviceVolumeSlider.value = settings.mainDeviceVolume;
    secondaryDeviceVolumeSlider.value = settings.secondaryDeviceVolume;
}

function getElementReferences(): void {
    messageHost = document.getElementById("message-host") as MessageHost;

    msbutton = document.getElementById("logo") as HTMLButtonElement;
    soundboardList = document.getElementById("soundboardlist") as SoundboardList;
    updateButton = document.getElementById("update-button") as HTMLButtonElement;
    addSoundboardButton = document.getElementById("button-addSoundboard") as HTMLButtonElement;
    addSoundboardDropArea = document.getElementById("droparea-addSoundboard") as FileDropArea;

    searchBox = document.getElementById("searchbox") as SearchBox;
    soundList = document.getElementById("soundlist") as SoundList;
    addSoundButton = document.getElementById("add-sound-button") as HTMLButtonElement;
    sortButton = document.getElementById("sort-button") as HTMLButtonElement;

    deviceSettings = document.getElementById("devicesettings") as HTMLDivElement;
    quickSettings = document.getElementById("quicksettings") as HTMLDivElement;
    deviceSettingsButton = document.getElementById("btndevicesettings") as HTMLButtonElement;
    quickSettingsButton = document.getElementById("btnquicksettings") as HTMLButtonElement;
    randomSoundButton = document.getElementById("btn-randomsound") as HTMLButtonElement;
    stopAllButton = document.getElementById("button-stopAll") as HTMLButtonElement;
    seekbar = document.getElementById("seekbar") as Seekbar;

    mainDeviceDropdown = deviceSettings.querySelector("#dropdown-mainDevice") as Dropdown;
    secondaryDeviceDropdown = deviceSettings.querySelector("#dropdown-secondaryDevice") as Dropdown;
    mainDeviceVolumeSlider = deviceSettings.querySelector("#slider-mainDeviceVolume") as Slider;
    secondaryDeviceVolumeSlider = deviceSettings.querySelector("#slider-secondaryDeviceVolume") as Slider;

    enabeKeybindsToggler = quickSettings.querySelector("#toggler-enableKeybinds") as Toggler;
    overlapSoundsToggler = quickSettings.querySelector("#toggler-overlapSounds") as Toggler;
    loopSoundsToggler = quickSettings.querySelector("#toggler-loopSounds") as Toggler;
    buttonMoreSettings = quickSettings.querySelector("#button-more-settings") as HTMLButtonElement;
}

function addElementListeners(): void {
    // This prevents scrolling with the middle mouse button.
    // It is necessary to allow clicking on sounds with the middle mouse button.
    document.addEventListener("mousedown", e => {
        if (e.button === 1) {
            e.preventDefault();
            return false;
        }
        return true;
    });

    addEventListener("keyup", (ev) => {
        if (ev.ctrlKey && ev.key == "+") window.actions.zoomIncrement(0.1);
        else if (ev.ctrlKey && ev.key == "-") window.actions.zoomIncrement(-0.1);
        else if (ev.ctrlKey && ev.key == "0") window.actions.zoomReset();
    });

    msbutton.addEventListener("click", () => {
        new MSModal().open();
    });

    addSoundboardButton.addEventListener("click", () => {
        void Actions.addSoundboard();
    });

    addSoundboardButton.addEventListener("mouseenter", () => {
        if (Draggable.currentElement instanceof SoundItem) {
            Draggable.currentElement.draggingToNewSoundboard = true;
        }
    });

    addSoundboardButton.addEventListener("mouseleave", () => {
        if (Draggable.currentElement instanceof SoundItem) {
            Draggable.currentElement.draggingToNewSoundboard = false;
        }
    });

    addSoundboardDropArea.onEnter.addHandler(() => addSoundboardButton.classList.add("hover"));
    addSoundboardDropArea.onLeave.addHandler(() => addSoundboardButton.classList.remove("hover"));

    addSoundboardDropArea.onDrop.addHandler(async e => {
        addSoundboardButton.classList.remove("hover");
        const paths = await Utils.getValidSoundPaths(e);
        if (paths) await Actions.addSounds(paths, null);
    });

    updateButton.addEventListener("click", () => {
        window.actions.installUpdate();
    });

    addSoundButton.addEventListener("click", () => {
        void browseAndAddSounds();
    });

    sortButton.addEventListener("click", () => {
        const currentSoundboard = soundboardList.getSelectedSoundboard();
        if (!currentSoundboard) return;
        void window.actions.sortSoundboard(currentSoundboard.uuid);
    });

    searchBox.onInput.addHandler(v => {
        soundList.filter(v);
    });

    searchBox.onButtonClick.addHandler(() => {
        soundList.filter("");
    });

    soundList.onSoundDragStart.addHandler(async () => {
        const s = await window.actions.getSettings();
        if (s.showSoundDragTutorial) {
            showSoundDragTutorial();
            window.actions.saveSettings({ showSoundDragTutorial: false });
        }
    });

    //#region Action Panel

    randomSoundButton.addEventListener("click", () => {
        void window.actions.executeQuickAction("playRandomSound");
    });

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
        void window.actions.executeQuickAction("toggleSoundOverlap");
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
        void window.actions.executeQuickAction("toggleKeybinds");
    });

    loopSoundsToggler.onToggle.addHandler(() => {
        void window.actions.executeQuickAction("toggleSoundLooping");
    });

    buttonMoreSettings.addEventListener("click", () => {
        quickSettings.classList.add("closed");
        new SettingsModal().open();
    });

    //#endregion
}

function loadDevices(devices: MediaDeviceInfo[]): void {
    secondaryDeviceDropdown.addItem(new DropdownDeviceItem("None", ""));
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

function showSoundDragTutorial(): void {
    const htmlMessage = `
        <p>Hold <kbd>CTRL</kbd> to copy.</p>
        <p>Hold <kbd>Shift</kbd> to group.</p>
    `;
    MessageQueue.pushMessage(new Message(htmlMessage));

    const tt = new Tooltip();
    tt.tooltipText = "Try dragging here!";
    tt.side = "left";
    tt.isAutomatic = false;
    tt.attach(addSoundboardButton);
    tt.show();

    addSoundboardButton.classList.add("shiny");
    addSoundboardButton.addEventListener("mouseover", () => {
        addSoundboardButton.classList.remove("shiny");
        tt.hide();
    });
}

//#endregion

//#region Main Events

GlobalEvents.addHandler("onUpdateReady", () => {
    updateButton.style.display = "inherit";
    console.log("READY TO UPDATE");
});

GlobalEvents.addHandler("onWindowFocusChanged", s => {
    if (s) document.body.classList.add("focused");
    else document.body.classList.remove("focused");
});

//#endregion

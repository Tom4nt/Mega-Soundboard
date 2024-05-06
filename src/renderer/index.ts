import Actions from "./util/actions";
import {
	Toggler,
	Slider,
	SoundboardList,
	Dropdown,
	SearchBox,
	MessageHost,
	Tooltip,
	Draggable,
	FileDropArea,
	PlayableList,
	PlayableItem,
} from "./elements";
import { MSModal, NewsModal, SettingsModal } from "./modals";
import * as MessageQueue from "./messageQueue";
import Utils from "./util/utils";
import { UpdaterState } from "../shared/interfaces";
import { DropDownItem } from "./elements/dropdown";
import { DropdownItem } from "./elements/dropdown/dropdownItem";
import { ISettingsData } from "../shared/models/dataInterfaces";
import Message from "../shared/models/message";
import AudioPlayer from "./audioPlayer";

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
let playableList!: PlayableList;
let addSoundButton!: HTMLButtonElement;
let openFolderButton!: HTMLButtonElement;
let sortButton!: HTMLButtonElement;

//#region Action Panel
let deviceSettings!: HTMLDivElement;
let quickSettings!: HTMLDivElement;
let deviceSettingsButton!: HTMLButtonElement;
let quickSettingsButton!: HTMLButtonElement;
let randomSoundButton!: HTMLButtonElement;
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

	const devices = await AudioPlayer.getAudioDevices();
	loadDevicesPanel(devices, content.settings);

	enabeKeybindsToggler.isOn = content.settings.quickActionStates.get("toggleKeybinds")!;
	overlapSoundsToggler.isOn = content.settings.quickActionStates.get("toggleSoundOverlap")!;
	loopSoundsToggler.isOn = content.settings.quickActionStates.get("toggleSoundLooping")!;

	window.events.keybindsStateChanged.addHandler(state => enabeKeybindsToggler.isOn = state);
	window.events.overlapSoundsStateChanged.addHandler(state => overlapSoundsToggler.isOn = state);
	window.events.loopSoundsChanged.addHandler(state => loopSoundsToggler.isOn = state);
	window.events.currentSoundboardChanged.addHandler(sb => updatePlayableListButtons(sb.linkedFolder !== null));

	const shouldShowChangelog = content.shouldShowChangelog;
	if (shouldShowChangelog) {
		const modal = await NewsModal.load();
		modal.open();
		window.actions.flagChangelogViewed();
	}

	const soundboards = content.soundboards;
	const currentSb = soundboards[content.settings.selectedSoundboard];
	for (const sb of soundboards) {
		soundboardList.addSoundboard(sb, sb == currentSb);
	}

	if (currentSb) {
		playableList.loadItems(content.initialPlayables, currentSb.uuid, currentSb.linkedFolder === null);
		updatePlayableListButtons(currentSb.linkedFolder !== null);
	}
}

function updatePlayableListButtons(isLinked: boolean): void {
	addSoundButton.style.display = isLinked ? "none" : "";
	openFolderButton.style.display = isLinked ? "" : "none";
}

function loadDevicesPanel(devices: MediaDeviceInfo[], settings: ISettingsData): void {
	loadDevices(devices);
	selectDevices(settings);
	setVolumes(settings);
}

function selectDevices(settings: ISettingsData): void {
	const foundMain = mainDeviceDropdown.selectIfFound(item =>
		item instanceof DropDownItem && item.value === settings.mainDevice);

	// If main device not found, load Default.
	if (!foundMain) mainDeviceDropdown.selectIfFound(item =>
		item instanceof DropDownItem && item.value == "default");

	const foundSecondary = secondaryDeviceDropdown.selectIfFound(item =>
		item instanceof DropDownItem && item.value === settings.secondaryDevice);

	// If secondary device not found, load None.
	if (!foundSecondary) secondaryDeviceDropdown.selectIfFound(item =>
		item instanceof DropDownItem && item.value === "");
}

function setVolumes(settings: ISettingsData): void {
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
	playableList = document.getElementById("soundlist") as PlayableList;
	addSoundButton = document.getElementById("add-sound-button") as HTMLButtonElement;
	openFolderButton = document.getElementById("open-folder-button") as HTMLButtonElement;
	sortButton = document.getElementById("sort-button") as HTMLButtonElement;

	deviceSettings = document.getElementById("devicesettings") as HTMLDivElement;
	quickSettings = document.getElementById("quicksettings") as HTMLDivElement;
	deviceSettingsButton = document.getElementById("btndevicesettings") as HTMLButtonElement;
	quickSettingsButton = document.getElementById("btnquicksettings") as HTMLButtonElement;
	randomSoundButton = document.getElementById("btn-randomsound") as HTMLButtonElement;
	stopAllButton = document.getElementById("button-stopAll") as HTMLButtonElement;

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
	// It is necessary to allow clicking on playables with the middle mouse button.
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
		if (Draggable.currentElement instanceof PlayableItem) {
			Draggable.currentElement.draggingToNewSoundboard = true;
		}
	});

	addSoundboardButton.addEventListener("mouseleave", () => {
		if (Draggable.currentElement instanceof PlayableItem) {
			Draggable.currentElement.draggingToNewSoundboard = false;
		}
	});

	addSoundboardDropArea.onEnter.addHandler(() => addSoundboardButton.classList.add("hover"));
	addSoundboardDropArea.onLeave.addHandler(() => addSoundboardButton.classList.remove("hover"));

	addSoundboardDropArea.onDrop.addHandler(async e => {
		addSoundboardButton.classList.remove("hover");
		const paths = await Utils.getValidSoundPaths(e);
		if (paths) {
			const sbId = await Actions.addSounds(paths, null);
			window.actions.setCurrentSoundboard(sbId);
		}
	});

	updateButton.addEventListener("click", () => {
		window.actions.installUpdate();
	});

	addSoundButton.addEventListener("click", () => {
		void browseAndAddSounds();
	});

	openFolderButton.addEventListener("click", async () => {
		const currentSoundboard = await window.actions.getCurrentSoundboard();
		if (currentSoundboard?.linkedFolder)
			window.location.href = currentSoundboard.linkedFolder;
	});

	sortButton.addEventListener("click", async () => {
		const currentSoundboard = await window.actions.getCurrentSoundboard();
		if (currentSoundboard) void window.actions.sortSoundboard(currentSoundboard.uuid);
	});

	searchBox.onInput.addHandler(v => {
		playableList.filter(v);
	});

	searchBox.onButtonClick.addHandler(() => {
		playableList.filter("");
	});

	playableList.onItemDragStart.addHandler(async () => {
		const s = await window.actions.getSettings();
		if (s.showSoundDragTutorial) {
			showPlayableDragTutorial();
			window.actions.saveSettings({ showSoundDragTutorial: false });
		}
	});

	//#region Action Panel

	randomSoundButton.addEventListener("click", () => {
		void window.actions.executeQuickAction("playRandomSound");
	});

	stopAllButton.addEventListener("click", () => {
		window.actions.stopAll();
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
		if (item?.value)
			window.actions.setMainDevice(item.value as string);
	});

	secondaryDeviceDropdown.onSelectedItem.addHandler(item => {
		if (item?.value)
			window.actions.setSecondaryDevice(item.value as string);
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
	secondaryDeviceDropdown.addItem(new DropdownItem("None", ""));
	for (const device of devices) {
		if (device.deviceId === "default") {
			mainDeviceDropdown.addItem(new DropdownItem("Default", "default"));
			secondaryDeviceDropdown.addItem(new DropdownItem("Default", "default"));
		} else {
			mainDeviceDropdown.addItem(new DropdownItem(device.label, device.deviceId));
			secondaryDeviceDropdown.addItem(new DropdownItem(device.label, device.deviceId));
		}
	}
}

function closeActionPanelContainers(e: MouseEvent): void {
	if (!e.composedPath().includes(deviceSettings) &&
		!e.composedPath().includes(deviceSettingsButton) &&
		!deviceSettings.classList.contains("closed")
	) {
		deviceSettings.classList.add("closed");
	}

	if (!e.composedPath().includes(quickSettings) &&
		!e.composedPath().includes(quickSettingsButton) &&
		!quickSettings.classList.contains("closed")
	) {
		quickSettings.classList.add("closed");
	}
}

async function browseAndAddSounds(): Promise<void> {
	const sb = await window.actions.getCurrentSoundboard();
	if (sb?.linkedFolder === null) {
		const paths = await window.actions.browseSounds();
		await Actions.addSounds(paths, sb.uuid);
		window.actions.setCurrentSoundboard(sb.uuid);
	}
}

function showPlayableDragTutorial(): void {
	const htmlMessage = `
        <p>Hold <kbd>CTRL</kbd> to copy.</p>
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

window.events.updateStateChanged.addHandler((state: UpdaterState) => {
	if (state == "downloaded") {
		updateButton.style.display = "inherit";
		console.log("READY TO UPDATE");
	}
});

window.events.windowFocusChanged.addHandler(s => {
	if (s) document.body.classList.add("focused");
	else document.body.classList.remove("focused");
});

//#endregion

import Actions from "./util/actions";
import {
	Toggler,
	Slider,
	SoundboardList,
	Dropdown,
	SearchBox,
	MessageHost,
	Tooltip,
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
import MSR from "./msr";
import { DragEventArgs } from "./draggableManager";

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
	initVolumeSliders();

	MessageQueue.setHost(messageHost);

	const devices = await AudioPlayer.getAudioDevices();
	loadDevicesPanel(devices, content.settings);

	enabeKeybindsToggler.isOn = content.settings.quickActionStates.get("toggleKeybinds")!;
	overlapSoundsToggler.isOn = content.settings.quickActionStates.get("toggleSoundOverlap")!;
	loopSoundsToggler.isOn = content.settings.quickActionStates.get("toggleSoundLooping")!;

	window.events.keybindsStateChanged.addHandler(state => {
		void MSR.instance.audioPlayer.playUI(state ? "on" : "off");
		return enabeKeybindsToggler.isOn = state;
	});
	window.events.overlapSoundsStateChanged.addHandler(state => overlapSoundsToggler.isOn = state);
	window.events.currentSoundboardChanged.addHandler(sb => updatePlayableListButtons(sb.linkedFolder !== null));
	window.events.loopSoundsChanged.addHandler(state => {
		loopSoundsToggler.isOn = state;
		MSR.instance.audioPlayer.setLoopState(state);
	});

	MSR.instance.draggableManager.onDragUpdate.addHandler(handleDragMove);
	MSR.instance.draggableManager.onDragEnd.addHandler(handleDragEnd);

	const shouldShowChangelog = content.shouldShowChangelog;
	if (shouldShowChangelog) {
		const modal = await NewsModal.load();
		void modal.open();
		window.actions.flagChangelogViewed();
	}

	const soundboards = content.soundboards;
	const currentSb = soundboards[content.settings.selectedSoundboard];
	for (const sb of soundboards) {
		soundboardList.addSoundboard(sb, sb == currentSb);
	}

	if (currentSb) {
		playableList.loadItems(content.initialPlayables, currentSb);
		updatePlayableListButtons(currentSb.linkedFolder !== null);
	}
}

function initVolumeSliders(): void {
	mainDeviceVolumeSlider.max = 1;
	mainDeviceVolumeSlider.step = 0.01;
	mainDeviceVolumeSlider.labelTextGenerator = Utils.volumeLabelGenerator;

	secondaryDeviceVolumeSlider.max = 1;
	secondaryDeviceVolumeSlider.step = 0.01;
	secondaryDeviceVolumeSlider.labelTextGenerator = Utils.volumeLabelGenerator;
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
		void new MSModal().open();
	});

	addSoundboardButton.addEventListener("click", () => {
		void Actions.addSoundboard();
	});

	addSoundboardButton.addEventListener("mouseenter", () => {
		const d = MSR.instance.draggableManager.currentGhost;
		if (d instanceof PlayableItem) {
			d.canAddToNewLocation = true;
		}
	});

	addSoundboardButton.addEventListener("mouseleave", () => {
		const d = MSR.instance.draggableManager.currentGhost;
		if (d instanceof PlayableItem) {
			d.canAddToNewLocation = false;
		}
	});

	addSoundboardDropArea.onEnter.addHandler(() => addSoundboardButton.classList.add("hover"));
	addSoundboardDropArea.onLeave.addHandler(() => addSoundboardButton.classList.remove("hover"));

	addSoundboardDropArea.onDrop.addHandler(async e => {
		addSoundboardButton.classList.remove("hover");
		const paths = await Utils.getValidSoundPaths(e);
		if (paths) {
			const sbId = await Actions.addSounds(paths, null);
			if (sbId) window.actions.setCurrentSoundboard(sbId);
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

	mainDeviceVolumeSlider.onInput.addHandler(s => {
		if (typeof mainDeviceDropdown.selectedItem?.value === "string")
			MSR.instance.audioPlayer.updateVolumesOnDevice(
				{ id: mainDeviceDropdown.selectedItem.value, volume: s.value }
			);
	});

	secondaryDeviceVolumeSlider.onValueChange.addHandler(s => {
		window.actions.setSecondaryDevice(undefined, s.value);
	});

	secondaryDeviceVolumeSlider.onInput.addHandler(s => {
		if (typeof secondaryDeviceDropdown.selectedItem?.value === "string")
			MSR.instance.audioPlayer.updateVolumesOnDevice(
				{ id: secondaryDeviceDropdown.selectedItem.value, volume: s.value }
			);
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
		void new SettingsModal().open();
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

//#region Handlers

const handleDragMove = (e: DragEventArgs): void => {
	const g = e.ghost;
	if (!(g instanceof PlayableItem)) return;

	const pointElements = document.elementsFromPoint(e.pos.x, e.pos.y);
	if (pointElements.includes(addSoundboardButton)) {
		g.canAddToNewLocation = true;
		g.isMovingToNewLocation = true;
		g.newLocationName = "New Soundboard";
		playableList.dragItemOutside();
	} else {
		playableList.dragItem(e.pos, g);
	}
};

const handleDragEnd = (e: DragEventArgs): void => {
	const g = e.ghost;
	if (!(g instanceof PlayableItem)) return;

	const pointElements = document.elementsFromPoint(e.pos.x, e.pos.y);
	if (pointElements.includes(addSoundboardButton)) {
		window.actions.copyOrMovePlayable(g.playable.uuid, null, !g.inCopyMode, 0);
	} else {
		playableList.dropItem(e.pos, g);
	}
};

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

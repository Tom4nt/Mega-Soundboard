const { ipcRenderer } = require("electron");
const path = require('path')

const MS = require('./models/MS.js');
const Sound = require("./models/Sound.js");

//#region Import Custom Elements
const Slider = require('./elements/Slider.js')
const Titlebar = require('./elements/Titlebar.js')
const KeyRecorder = require('./elements/KeyRecorder.js')
const SoundList = require('./elements/SoundList.js')
const TextField = require('./elements/TextField.js')
const FileSelector = require('./elements/FileSelector.js')
const Checkbox = require('./elements/Toggler.js')
const Dropdown = require('./elements/Dropdown.js')
const IconButton = require('./elements/IconButton.js')
const SoundboardList = require('./elements/SoundboardList.js')
const Modal = require('./elements/modals/Modal.js')

const SoundModal = require('./elements/modals/SoundModal.js')
const SoundboardModal = require('./elements/modals/SoundboardModal.js')
const SettingsModal = require('./elements/modals/SettingsModal.js')
const KeybindManager = require('./models/KeybindManager.js');
const NewsModal = require("./elements/modals/NewsModal.js");
const MSModal = require('./elements/modals/MSModal')
//#endregion

//#region Define Custom elements
customElements.define("ms-slider", Slider);
customElements.define('ms-titlebar', Titlebar);
customElements.define("ms-keyrecorder", KeyRecorder)
customElements.define('ms-soundlist', SoundList);
customElements.define("ms-textfield", TextField)
customElements.define('ms-fileselector', FileSelector)
customElements.define('ms-checkbox', Checkbox)
customElements.define('ms-dropdown', Dropdown)
customElements.define('ms-iconbutton', IconButton)
customElements.define('ms-soundboardlist', SoundboardList);
customElements.define('ms-modal', Modal);
customElements.define("ms-soundboardmodal", SoundboardModal);
customElements.define("ms-soundmodal", SoundModal);
customElements.define('ms-settings-modal', SettingsModal);
customElements.define('ms-newsmodal', NewsModal);
customElements.define('ms-msmodal', MSModal);
//#endregion

//#region Elements

const fileDragOverlay = document.getElementById('filedragoverlay')

//#region Left
const msbutton = document.getElementById('logo');
const soundboardList = document.getElementById("soundboardlist");
const updateButton = document.getElementById("update-button");
//#endregion

//#region Right
const soundList = document.getElementById("soundlist")
const addSoundButton = document.getElementById("add-sound-button")
const addSoundboardButton = document.getElementById("button-addSoundboard")
const soundlistSearchbox = document.getElementById("soundlist-searchbox")
const soundlistSearchboxButton = document.getElementById("soundlist-searchbox-button")

//#region Action Panel
const deviceSettings = document.getElementById("devicesettings")
const quickSettings = document.getElementById("quicksettings")
const deviceSettingsButton = document.getElementById("btndevicesettings")
const quickSettingsButton = document.getElementById("btnquicksettings");
const stopAllButton = document.getElementById("button-stopAll")

//#region Devices
const mainDeviceDropdown = deviceSettings.querySelector("#dropdown-mainDevice")
const secondaryDeviceDropdown = deviceSettings.querySelector("#dropdown-secondaryDevice")
const mainDeviceVolumeSlider = deviceSettings.querySelector("#slider-mainDeviceVolume")
const secondaryDeviceVolumeSlider = deviceSettings.querySelector("#slider-secondaryDeviceVolume");
//#endregion

//#region QuickSettings
const enabeKeybindsToggler = quickSettings.querySelector("#toggler-enableKeybinds")
const overlapSoundsToggler = quickSettings.querySelector("#toggler-overlapSounds");
const buttonMoreSettings = quickSettings.querySelector('#button-more-settings');
//#endregion

//#endregion

//#endregion

//#endregion

//#region Events

MS.eventDispatcher.addEventListener(MS.EVENT_TOGGLED_KEYBINDS_STATE, () => {
    enabeKeybindsToggler.toggled = MS.settings.enableKeybinds
})

KeybindManager.eventDispatcher.addEventListener(KeybindManager.EVENT_SELECT_SOUNDBOARD, (e) => {
    soundboardList.selectSoundboard(e.detail.soundboard)
})

window.ondragenter = (e) => {
    if (e.relatedTarget) return
    console.log('File or files dragged to the window.')
}

window.ondragleave = (e) => {
    if (e.relatedTarget) return
    soundList.endFileDrag()
}

window.ondragover = (e) => {
    e.preventDefault()
    soundList.handleFileDrag(e)
}

window.ondrop = (e) => {
    soundList.endFileDrag(e)
}

//#region Window

window.addEventListener("load", () => {
    MS.data.soundboards.forEach(soundboard => {
        KeybindManager.registerSoundboardn(soundboard)
        soundboardList.addSoundboard(soundboard)
    });

    MS.initDevices((devices) => {
        console.log(devices)

        fillDeviceLists(devices)
        mainDeviceDropdown.selectData(MS.settings.mainDevice ? MS.settings.mainDevice : "default")
        secondaryDeviceDropdown.selectData(MS.settings.secondaryDevice)
    })

    //Select saved soundboardID
    soundboardList.selectSoundboardAt(MS.settings.selectedSoundboard)

    //Set device volumes from settings
    mainDeviceVolumeSlider.value = MS.settings.mainDeviceVolume
    secondaryDeviceVolumeSlider.value = MS.settings.secondaryDeviceVolume

    //Fill quick settings
    enabeKeybindsToggler.toggled = MS.settings.enableKeybinds
    overlapSoundsToggler.toggled = MS.settings.overlapSounds

    //Send quick settings states to main
    ipcRenderer.send("settings.enableKeybinds", enabeKeybindsToggler.toggled)
    ipcRenderer.send("settings.overlapSounds", overlapSoundsToggler.toggled)

    //Register global settings keybinds
    KeybindManager.registerAction(MS.settings.stopSoundsKeys, () => { MS.stopAllSounds() }, 'stop-sounds')
    KeybindManager.registerAction(MS.settings.enableKeybindsKeys, () => { MS.toggleKeybindsState() }, 'toggle-keybinds-state')

    // Decide whether to show the changelog or not
    if (MS.latestWithLog > MS.settings.latestLogViewed && MS.settings.latestLogViewed >= 0) {
        const modal = new NewsModal()
        modal.open()
        MS.settings.latestLogViewed = MS.latestWithLog
        MS.settings.save()
    }
})

window.addEventListener("click", (e) => {
    closeActionPanelContainers(e)
})

window.addEventListener("contextmenu", (e) => {
    closeActionPanelContainers(e)
})

//#endregion

//#region Left

msbutton.addEventListener('click', () => {
    const modal = new MSModal();
    modal.open()
})

addSoundboardButton.addEventListener('click', (e) => {
    const modal = new SoundboardModal(SoundboardModal.Mode.ADD)
    modal.open()
    modal.addEventListener('add', (e) => {
        const soundboard = e.detail.soundboard
        soundboardList.addSoundboard(soundboard)
        KeybindManager.registerSoundboardn(soundboard)
        MS.data.addSoundboard(soundboard)
        MS.data.save()
    });
})

updateButton.addEventListener('click', () => {
    ipcRenderer.send('update.perform')
})

soundboardList.addEventListener("soundboardselect", (e) => {
    selectSoundboard(e.detail.soundboard)
})

//#endregion

//#region Right

addSoundButton.addEventListener('click', (e) => {
    ipcRenderer.invoke('file.browse', true, 'Audio files', ['mp3', 'wav', 'ogg']).then((files) => {
        if (!files) return

        if (files.length == 1) {
            const sb = MS.getSelectedSoundboard()
            var modal = new SoundModal(SoundModal.Mode.ADD, null, files[0])
            modal.open()
            modal.addEventListener('add', (e) => {
                let sound = e.detail.sound
                sound.soundboard = sb
                addSound(sound)
                MS.data.save()
            })
        } else {
            files.forEach(file => {
                const soundName = path.basename(file, path.extname(file))
                const sound = new Sound(soundName, file, 100, null, MS.getSelectedSoundboard())
                addSound(sound)
            });
            MS.data.save()
        }
    })
})

soundlistSearchbox.addEventListener('input', (e) => {
    soundList.filter = soundlistSearchbox.value
})

soundlistSearchboxButton.addEventListener('click', (e) => {
    if (soundlistSearchbox.value) {
        soundList.filter = ""
    }
})

soundList.addEventListener('soundboardselect', (e) => {
    if (MS.getSelectedSoundboard() === e.detail.soundboard) return;
    soundboardList.selectSoundboard(e.detail.soundboard)
})

soundList.addEventListener('reorder', (e) => {
    const sound = e.detail.sound
    const oldSB = e.detail.oldSoundboard
    const newSB = e.detail.newSoundboard
    if (oldSB === newSB) return

    if (sound.isPlaying()) {
        soundboardList.incrementPlayingSound(oldSB, -1)
        soundboardList.incrementPlayingSound(newSB, 1)
    }
})

//#endregion

//#region Action Panel

stopAllButton.addEventListener("click", (e) => {
    MS.stopAllSounds()
})

deviceSettingsButton.addEventListener("click", () => {
    deviceSettings.classList.toggle('closed')
})

quickSettingsButton.addEventListener("click", () => {
    quickSettings.classList.toggle('closed')
})

overlapSoundsToggler.addEventListener("toggle", (e) => {
    ipcRenderer.send("settings.overlapSounds", overlapSoundsToggler.toggled)
    setOverlapSoundsSettings(overlapSoundsToggler.toggled)
})

mainDeviceVolumeSlider.addEventListener("change", (e) => { MS.settings.mainDeviceVolume = parseInt(e.target.value) })
secondaryDeviceVolumeSlider.addEventListener("change", (e) => { MS.settings.secondaryDeviceVolume = parseInt(e.target.value) })

mainDeviceDropdown.addEventListener("itemselect", (e) => {
    const data = e.detail.data
    MS.settings.mainDevice = data
})

secondaryDeviceDropdown.addEventListener("itemselect", (e) => {
    const data = e.detail.data
    MS.settings.secondaryDevice = data
})

enabeKeybindsToggler.addEventListener("toggle", (e) => {
    ipcRenderer.send("settings.enableKeybinds", enabeKeybindsToggler.toggled)
    setKeybindsToggleSettings(enabeKeybindsToggler.toggled)
})

buttonMoreSettings.addEventListener('click', (e) => {
    quickSettings.classList.add('closed')
    MS.settings.save()
    let modal = new SettingsModal()
    modal.open()
});

//#endregion

//#endregion

//#region Functions

//#region Devices

function fillDeviceLists(devices) {
    secondaryDeviceDropdown.addStringItem("None", null)
    devices.forEach(device => {
        if (device.deviceId === "default") {
            mainDeviceDropdown.addStringItem("Default", "default")
            secondaryDeviceDropdown.addStringItem("Default", "default")
        } else {
            mainDeviceDropdown.addStringItem(device.label, device.deviceId)
            secondaryDeviceDropdown.addStringItem(device.label, device.deviceId)
        }
    });
}
//#endregion

function selectSoundboard(soundboard) {
    if (!soundboard) return
    const currSB = MS.getSelectedSoundboard()
    setSoundlistSounds(soundboard)
    if (currSB) KeybindManager.unregisterSounds(currSB)
    MS.setSelectedSoundboard(soundboard)
    soundboard.sounds.forEach(sound => {
        KeybindManager.registerSound(sound)
    })
    MS.settings.save()
}

function setSoundlistSounds(soundboard) {
    if (soundboard) soundList.setSounds(soundboard.sounds)
}

function setKeybindsToggleSettings(state) {
    MS.settings.enableKeybinds = state
    MS.settings.save()
}

function setOverlapSoundsSettings(state) {
    MS.settings.overlapSounds = state
    MS.settings.save()
}

function closeActionPanelContainers(e) {
    if (!e.path.includes(deviceSettings) && e.target != deviceSettingsButton && !deviceSettings.classList.contains('closed')) {
        deviceSettings.classList.add('closed')
        MS.settings.save()
    }
    if (!e.path.includes(quickSettings) && e.target != quickSettingsButton && !quickSettings.classList.contains('closed')) {
        quickSettings.classList.add('closed')
        MS.settings.save()
    }
}

/**
 * Adds a sound to the selected soundboard in the sound list and data. Registers keybinds.
 * @param {Sound} sound 
 */
function addSound(sound) {
    soundList.addSound(sound)
    KeybindManager.registerSound(sound)
    MS.getSelectedSoundboard().addSound(sound)
}

//#endregion

//#region Main Events

ipcRenderer.on("update.available", function () {
    // updateButton.updateReady = false;
    // updateButton.style.display = "inline-block";
    // updateButton.classList.add("downloading");
    // updateButton.classList.remove("update");
    // updateButton.firstElementChild.firstElementChild.innerHTML = "Downloading Update";
    // updateButton.firstElementChild.style.width = "0%";
});

ipcRenderer.on("update.progress", function (e, progress) {
    // updateButton.firstElementChild.style.width = progress.percent + "%";
});

ipcRenderer.on("update.ready", function () {
    updateButton.style.display = 'inherit'
    console.log("READY TO UPDATE");
});

ipcRenderer.on("settings.overlapSounds", function (e, state) {
    overlapSoundsToggler.toggled = state
    setOverlapSoundsSettings(state)
})

ipcRenderer.on("settings.enableKeybinds", function (e, state) {
    enabeKeybindsToggler.toggled = state
    setKeybindsToggleSettings(state)
})

//#endregion
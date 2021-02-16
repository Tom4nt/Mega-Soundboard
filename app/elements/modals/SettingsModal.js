const KeyRecorder = require("../KeyRecorder");
const Modal = require("./Modal");
const MS = require('../../models/MS.js');
const KeybindManager = require("../../models/KeybindManager");
const Toggler = require("../Toggler.js");
const FileSelector = require("../FileSelector");

class SettingsModal extends Modal {

    constructor() {
        super()
        this.title = "Settings"
    }

    getBodyElements() {
        const stopSoundsRecorder = new KeyRecorder();
        const keybindsStateRecorder = new KeyRecorder();
        const minimizeToTrayToggler = new Toggler("Minimize to tray");
        const soundsLocationFileSelector = new FileSelector('', FileSelector.FOLDER_TYPE)
        this.soundsLocationFileSelector = soundsLocationFileSelector

        stopSoundsRecorder.keys = MS.settings.stopSoundsKeys
        keybindsStateRecorder.keys = MS.settings.enableKeybindsKeys
        minimizeToTrayToggler.toggled = MS.settings.minToTray
        this.minimizeToTrayToggler = minimizeToTrayToggler
        soundsLocationFileSelector.path = MS.settings.getSoundsLocation()

        const elements = [
            Modal.getLabel("Stop all Sounds"),
            stopSoundsRecorder,
            Modal.getLabel("Enable/Disable keybinds"),
            keybindsStateRecorder,
            minimizeToTrayToggler,
            Modal.getLabel("Moved Sounds Location"),
            soundsLocationFileSelector
        ]

        stopSoundsRecorder.addEventListener(KeyRecorder.EVENT_STOP_RECORDING, () => {
            this._registerStopSoundsKeybind(stopSoundsRecorder.keys)
        })

        stopSoundsRecorder.addEventListener(KeyRecorder.EVENT_CLEAR, () => {
            this._registerStopSoundsKeybind(stopSoundsRecorder.keys)
        })

        keybindsStateRecorder.addEventListener(KeyRecorder.EVENT_STOP_RECORDING, () => {
            this._registerEnableKeybindsKeybind(keybindsStateRecorder.keys)
        })

        keybindsStateRecorder.addEventListener(KeyRecorder.EVENT_CLEAR, () => {
            this._registerEnableKeybindsKeybind(keybindsStateRecorder.keys)
        })

        minimizeToTrayToggler.addEventListener("toggle", () => {
            MS.setMinToTray(minimizeToTrayToggler.toggled)
        })

        return elements
    }

    getFooterButtons() {
        const buttons = [
            Modal.getButton("Close", () => { this.close() }),
        ]

        return buttons
    }

    close() {
        super.close()
        this._save()
    }

    _registerStopSoundsKeybind(keybind) {
        MS.settings.stopSoundsKeys = keybind
        MS.settings.save()
        KeybindManager.registerAction(keybind, () => { MS.stopAllSounds() }, 'stop-sounds')
    }

    _registerEnableKeybindsKeybind(keybind) {
        MS.settings.enableKeybindsKeys = keybind
        MS.settings.save()
        KeybindManager.registerAction(keybind, () => { MS.toggleKeybindsState() }, 'toggle-keybinds-state')
    }

    _save() {
        if (this.soundsLocationFileSelector.isPathValid()) {
            MS.settings.soundsLocation = this.soundsLocationFileSelector.path
        }
        MS.settings.save()
    }
}

module.exports = SettingsModal
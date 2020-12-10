const KeyRecorder = require("../KeyRecorder");
const Modal = require("./Modal");
const MS = require('../../models/MS.js');
const KeybindManager = require("../../models/KeybindManager");
const Toggler = require("../Toggler.js")

class SettingsModal extends Modal {

    constructor() {
        super()
        this.title = "Settings"
    }

    getBodyElements() {
        const stopSoundsRecorder = new KeyRecorder();
        const keybindsStateRecorder = new KeyRecorder();
        const minimizeToTrayToggler = new Toggler("Minimize to tray");

        stopSoundsRecorder.keys = MS.settings.stopSoundsKeys
        keybindsStateRecorder.keys = MS.settings.enableKeybindsKeys
        minimizeToTrayToggler.toggled = MS.settings.minToTray

        const elements = [
            Modal.getLabel("Stop Sounds"),
            stopSoundsRecorder,
            Modal.getLabel("Enable/Disable keybinds"),
            keybindsStateRecorder,
            minimizeToTrayToggler
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
            MS.settings.save()
        })

        return elements
    }

    getFooterButtons() {
        const buttons = [
            Modal.getButton("Close", () => { this.close() }),
        ]

        return buttons
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
}

module.exports = SettingsModal
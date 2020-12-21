/*** MEGA SOUNDBOARD SINGLETON ***/

const Data = require('../models/Data.js');
const Settings = require('../models/Settings.js');
const { ipcRenderer } = require('electron');
const Soundboard = require('./Soundboard.js');
const Sound = require('./Sound.js');

class MS {
    static get SOUND_ON() { return "res/audio/on.wav" }
    static get SOUND_OFF() { return "res/audio/off.wav" }
    static get SOUND_ERR() { return "res/audio/error.wav" }

    static playUISound(sound) {
        if (MS.uiSound) {
            MS.uiSound.src = "";
            MS.uiSound.load();
        }
        let s = new Audio(sound);
        MS.uiSound = s;
        s.play();
    }

    /**
     * Plays a sound on the selected output devices.
     * @param {Sound} sound 
     */
    static playSound(sound) {
        if (sound) {
            if (!MS.settings.overlapSounds) this.stopAllSounds()
            const result = sound.play(() => {
                MS.playingSounds.splice(MS.playingSounds.indexOf(sound), 1)
            }, MS.settings.mainDeviceVolume, MS.settings.secondaryDeviceVolume, MS.settings.mainDevice, MS.settings.secondaryDevice);

            if (result) {
                if (!MS.playingSounds.includes(sound)) {
                    MS.playingSounds.push(sound)
                }
                return true
            } else {
                return false
            }
        }
    }

    static stopAllSounds() {
        for (var i = 0; i < MS.playingSounds.length; i++) {
            /*playingSounds[i].src = "";
            playingSounds[i].load();*/
            MS.playingSounds[i].stop()
            MS.playingSounds.splice(i, 1);
            i--;
        }
    }

    /**
     * @returns {Soundboard}
     */
    static getSelectedSoundboard() {
        return this.data.soundboards[this.settings.selectedSoundboard]
    }

    static setSelectedSoundboard(soundboard) {
        for (let i = 0; i < this.data.soundboards.length; i++) {
            const sb = this.data.soundboards[i];
            if (sb == soundboard) {
                this.settings.selectedSoundboard = i
            }
        }
    }

    static toggleKeybindsState() {
        if (MS.settings.enableKeybinds) {
            this.playUISound(MS.SOUND_OFF)
        } else {
            this.playUISound(MS.SOUND_ON)
        }
        MS.settings.enableKeybinds = !MS.settings.enableKeybinds
        ipcRenderer.send("settings.enableKeybinds", MS.settings.enableKeybinds)
        MS.eventDispatcher.dispatchEvent(new CustomEvent(MS.EVENT_TOGGLED_KEYBINDS_STATE))
    }

    static initDevices(callback) {
        navigator.mediaDevices.enumerateDevices()
            .then(function(devices_) {
                MS.devices = devices_.filter(device => device.kind == "audiooutput" &&
                    /*device.deviceId != "default" &&*/
                    device.deviceId != "communications"
                );
                callback(MS.devices)
            });
    }

    static setMinToTray(value) {
        MS.settings.minToTray = value
        ipcRenderer.send('win.minToTray', value)
    }

    static getDevices() {
        if (MS.devices.length > 0) {
            return MS.devices
        }
    }

    /**
     * @returns {Number}
     */
    static getElementIndex(element) {
        let i = 0;
        while ((element = element.previousElementSibling) != null) ++i;
        return i;
    }
}

module.exports = MS
MS.devices = []
MS.playingSounds = []
MS.data = Data.load()
MS.settings = Settings.load()
MS.eventDispatcher = new EventTarget()
MS.recordingKey = false

MS.EVENT_TOGGLED_KEYBINDS_STATE = "toggled-keybinds-state"
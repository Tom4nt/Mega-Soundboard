/*** MEGA SOUNDBOARD SINGLETON ***/

const Data = require('../models/Data.js');
const Settings = require('../models/Settings.js');
const { ipcRenderer } = require('electron');

class MS {
    static get SOUND_ON() { return 'res/audio/on.wav' }
    static get SOUND_OFF() { return 'res/audio/off.wav' }
    static get SOUND_ERR() { return 'res/audio/error.wav' }

    static playUISound(sound) {
        if (MS.uiSound) {
            MS.uiSound.src = '';
            MS.uiSound.load();
        }
        let s = new Audio(sound);
        MS.uiSound = s;
        s.play();
    }

    /**
     * Plays a sound on the selected output devices.
     */
    static async playSound(sound) {
        if (sound) {
            if (!MS.settings.overlapSounds) this.stopAllSounds()
            const promise = sound.play(() => {
                this._removeSoundFromInstancesList(sound)
                MS.eventDispatcher.dispatchEvent(new CustomEvent(MS.EVENT_SOUND_STOP, { detail: sound }))
            },
                MS.settings.mainDeviceVolume, MS.settings.secondaryDeviceVolume, MS.settings.mainDevice, MS.settings.secondaryDevice);

            return promise.then((res) => {
                if (!MS.playingSounds.includes(sound)) {
                    MS.playingSounds.push(sound)
                    MS.eventDispatcher.dispatchEvent(new CustomEvent(MS.EVENT_SOUND_PLAY, { detail: sound }))
                }
            })
        }
    }

    static stopSound(sound) {
        if (sound && sound.isPlaying()) {
            this._removeSoundFromInstancesList(sound)
            sound.stop()
            MS.eventDispatcher.dispatchEvent(new CustomEvent(MS.EVENT_SOUND_STOP, { detail: sound }))
        }
    }

    static stopAllSounds() {
        for (var i = 0; i < MS.playingSounds.length; i++) {
            MS.playingSounds[i].stop()
            MS.playingSounds.splice(i, 1);
            i--;
        }
        MS.eventDispatcher.dispatchEvent(new CustomEvent(MS.EVENT_STOP_ALL_SOUNDS))
    }

    static getSelectedSoundboard() {
        return this.data.soundboards[this.settings.selectedSoundboard]
    }

    static setSelectedSoundboard(soundboard) {
        for (let i = 0; i < this.data.soundboards.length; i++) {
            const sb = this.data.soundboards[i];
            if (sb === soundboard) {
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
        ipcRenderer.send('settings.enableKeybinds', MS.settings.enableKeybinds)
        MS.eventDispatcher.dispatchEvent(new CustomEvent(MS.EVENT_TOGGLED_KEYBINDS_STATE))
    }

    static initDevices(callback) {
        navigator.mediaDevices.enumerateDevices()
            .then(function (devices_) {
                MS.devices = devices_.filter(device => device.kind == 'audiooutput' &&
                    device.deviceId != 'communications'
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

    static getVersion() {
        return ipcRenderer.invoke('version')
    }

    static _removeSoundFromInstancesList(sound) {
        MS.playingSounds.splice(MS.playingSounds.indexOf(sound), 1)
    }

    static openPopup(text, rect, position) {
        if (!position) position = 'top'
        const middleX = rect.x + rect.width / 2

        let div = document.getElementById('popup-layer')

        let popup = document.createElement('div')
        popup.innerHTML = text
        popup.classList.add('popup')
        if (position) popup.classList.add(position)

        popup.style.opacity = 0
        popup.style.transform = 'scale(0.8)'

        div.appendChild(popup)

        if (position != 'left' && position != 'right') popup.style.left = middleX - (popup.offsetWidth / 2) + 'px'
        else {
            if (position == 'left') {
                popup.style.left = rect.x - popup.offsetWidth - 12 + 'px'
            } else {
                popup.style.left = rect.x + rect.width + 12 + 'px'
            }
        }

        if (position == 'bottom') {
            popup.style.top = rect.y + rect.height + 12 + 'px'
        } else if (position == 'top') {
            popup.style.top = rect.y - popup.offsetHeight - 12 + 'px'
        } else {
            popup.style.top = rect.y + (rect.height - popup.offsetHeight) / 2 + 'px'
        }

        popup.style.opacity = null
        popup.style.transform = null

        return popup
    }

    static addPopup(text, element, position) {
        let popup = null
        element.addEventListener('mouseenter', e => {
            const rect = element.getBoundingClientRect()
            popup = this.openPopup(text, rect, position)
        })

        element.addEventListener('mouseleave', e => {
            this.closePopup(popup)
        })
    }

    /**
     * @param {HTMLElement} popupElement 
     */
    static closePopup(popupElement) {
        if (popupElement) {
            popupElement.style.opacity = 0
            popupElement.style.transform = 'scale(0.8)'
            popupElement.ontransitionend = () => {
                popupElement.remove()
            }
        }
    }
}

MS.latestWithLog = 1 // Increments on every version that should display the changelog.

MS.devices = []
MS.playingSounds = []
MS.data = Data.load()
MS.settings = Settings.load()
MS.eventDispatcher = new EventTarget()
MS.recordingKey = false
MS.modalsOpen = 0

MS.EVENT_TOGGLED_KEYBINDS_STATE = 'toggled-keybinds-state'
MS.EVENT_SOUND_PLAY = 'sound-play'
MS.EVENT_SOUND_STOP = 'sound-stop'
MS.EVENT_STOP_ALL_SOUNDS = 'sound-stopall'

module.exports = MS
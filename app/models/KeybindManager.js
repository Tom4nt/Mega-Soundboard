const MS = require("./MS.js")
const Sound = require("./Sound.js")
const Soundboard = require("./Soundboard.js")

const { ipcRenderer } = require("electron");

const LOG = true

class KeybindManager {

    /** @param {Soundboard} soundboard */
    static registerSoundboardn(soundboard) {
        this.unregisterSoundboard(soundboard)
        if (!soundboard.keys) return;
        ipcRenderer.invoke("key.register", soundboard.keys).then((id) => {
            if (LOG) console.log("Registered " + soundboard.name + " with the id of " + id);
            KeybindManager.actions[id] = () => this._selectSoundboard(soundboard)
            KeybindManager.soundboards.push({ id: id, soundboard: soundboard })
        })
    }

    static unregisterSoundboardAndSounds(soundboard) {
        this.unregisterSounds(soundboard)
        this.unregisterSoundboard(soundboard)
    }

    static unregisterSoundboard(soundboard) {
        const existingID = this._getIdFromSoundboard(soundboard)
        if (existingID) {
            if (LOG) console.log("Uregistering " + soundboard.name + " (ID: " + existingID + ")")
            ipcRenderer.invoke("key.unregister", existingID)
            delete KeybindManager.actions[existingID]
            this._deleteSoundboard(soundboard)
        }
    }

    /** @param {Sound} sound */
    static registerSound(sound) {
        this.unregisterSound(sound)
        if (!sound.keys) return
        ipcRenderer.invoke("key.register", sound.keys).then((id) => {
            if (LOG) console.log("Registered " + sound.name + " with the id of " + id)
            KeybindManager.actions[id] = () => this._playSound(sound)
            KeybindManager.sounds.push({ id: id, sound: sound })
        })
    }

    static unregisterSound(sound) {
        const existingID = this._getIdFromSound(sound)
        if (existingID) {
            if (LOG) console.log("Uregistering " + sound.name + " (ID: " + existingID + ")")
            ipcRenderer.invoke("key.unregister", existingID)
            delete KeybindManager.actions[existingID]
            this._deleteSound(sound)
        }
    }

    static unregisterSounds(soundboard) {
        soundboard.sounds.forEach(sound => {
            this.unregisterSound(sound)
        })
    }

    static registerAction(keybind, action, code) {
        this.unregisterAction(code)
        if (!keybind) return
        ipcRenderer.invoke("key.register", keybind).then((id) => {
            if (LOG) console.log("Registered an action with the id of " + id)
            KeybindManager.actions[id] = () => action()
            KeybindManager.actionIDs.push({ id: id, code: code })
        })
    }

    static unregisterAction(code) {
        const existingID = this._getIDFromCode(code)
        if (existingID) {
            if (LOG) console.log(`Uregistering action. (ID: ${existingID})`)
            ipcRenderer.invoke("key.unregister", existingID)
            delete KeybindManager.actions[existingID]
            this._deleteActionID(code)
        }
    }

    static _getIdFromSoundboard(soundboard) {
        let id = null
        KeybindManager.soundboards.forEach(element => {
            if (element.soundboard == soundboard) {
                id = element.id
            }
        });
        return id
    }

    static _getIdFromSound(sound) {
        let id = null
        KeybindManager.sounds.forEach(element => {
            if (element.sound == sound) {
                id = element.id
            }
        });
        return id
    }

    static _getIDFromCode(code) {
        let id = null
        KeybindManager.actionIDs.forEach(element => {
            if (element.code == code) {
                id = element.id
            }
        });
        return id
    }

    static _deleteSoundboard(soundboard) {
        let id = null
        for (let i = 0; i < KeybindManager.soundboards.length; i++) {
            const element = KeybindManager.soundboards[i];
            if (element.soundboard == soundboard) {
                id = i
                break
            }
        }
        if (id) KeybindManager.soundboards.splice(id, 1)
    }

    static _deleteSound(sound) {
        let id = null
        for (let i = 0; i < KeybindManager.sounds.length; i++) {
            const element = KeybindManager.sounds[i];
            if (element.sound == sound) {
                id = i
                break
            }
        }
        if (id) KeybindManager.sounds.splice(id, 1)
    }

    static _deleteActionID(code) {
        let id = null
        for (let i = 0; i < KeybindManager.actionIDs.length; i++) {
            const element = KeybindManager.actionIDs[i];
            if (element.code == code) {
                id = i;
                break;
            }
        }
        if (id) KeybindManager.actionIDs.splice(id, 1)
    }

    static _playSound(sound) {
        if (MS.settings.enableKeybinds && !KeybindManager.lock) {
            if (LOG) console.log("Playing sound " + sound.name + " via keybind.");
            if (!MS.playSound(sound)) {
                MS.playUISound(MS.SOUND_ERR)
            }
        }
    }

    static _selectSoundboard(soundboard) {
        if (MS.settings.enableKeybinds && !KeybindManager.lock) {
            if (LOG) console.log("Selecting Soundboard " + soundboard.name + " via keybind.")
            const detail = { soundboard: soundboard }
            this.eventDispatcher.dispatchEvent(new CustomEvent(this.EVENT_SELECT_SOUNDBOARD, { detail: detail }))
        }
    }
}

module.exports = KeybindManager
KeybindManager.actions = []
KeybindManager.sounds = []
KeybindManager.soundboards = []
KeybindManager.actionIDs = []
KeybindManager.lock = false
KeybindManager.eventDispatcher = new EventTarget()

KeybindManager.EVENT_SELECT_SOUNDBOARD = "soundboard-select"
KeybindManager.EVENT_SOUND_PLAY = "sound-play"

ipcRenderer.on("key.perform", (e, id) => {
    if (KeybindManager.actions[id]) {
        KeybindManager.actions[id]()
    }
})
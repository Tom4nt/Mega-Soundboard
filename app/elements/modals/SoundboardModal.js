const Modal = require('./Modal.js')
const Slider = require('../Slider.js')
const TextField = require('../TextField.js')
const KeyRecorder = require('../KeyRecorder.js')
const Soundboard = require('../../models/Soundboard.js')
const FileSelector = require('../FileSelector.js')
const { isValidSoundFile } = require('../../models/Utils.js')

const Mode = {
    ADD: 'add',
    EDIT: 'edit'
}

class SoundboardModal extends Modal {
    /**
     * @param {Modes} mode 
     * @param {Soundboard} soundboard 
     */
    constructor(mode, soundboard, hideDelete) {
        super()
        this.mode = mode
        this.hideDelete = hideDelete
        if (mode == Mode.ADD)
            super.title = "Add Soundboard"
        else {
            super.title = "Edit Soundboard"
            this.soundboard = soundboard
        }
    }

    getBodyElements() {
        this.nameInput = new TextField("Name")
        this.keysInput = new KeyRecorder()
        this.volumeSlider = new Slider('Volume')
        this.lfFileSelector = new FileSelector("Linked Folder (Optional)", FileSelector.FOLDER_TYPE)

        if (this.mode == Mode.EDIT) {
            this.nameInput.text = this.soundboard.name
            this.keysInput.keys = this.soundboard.keys
            this.volumeSlider.value = this.soundboard.volume
            this.lfFileSelector.path = this.soundboard.linkedFolder
        }

        const items = [
            this.nameInput,
            this.volumeSlider,
            Modal.getLabel("Set Active"),
            this.keysInput,
        ]

        if (this.mode == Mode.ADD || this.soundboard.linkedFolder || this.soundboard.sounds.length < 1) {
            items.splice(1, 0, this.lfFileSelector)
        }

        return items
    }

    getFooterButtons() {
        let buttonName = "add"
        if (this.mode == Mode.EDIT)
            buttonName = "save"

        const buttons = [
            Modal.getButton("close", () => { super.close() }),
            Modal.getButton(buttonName, () => { this.soundboardAction() })
        ]

        if (this.mode == Mode.EDIT && !this.hideDelete)
            buttons.unshift(Modal.getButton("remove", () => { this.removeSoundboard() }, true, true))

        return buttons
    }

    soundboardAction() {
        let valid = true
        if (!this.nameInput.text || !this.nameInput.text.trim()) {
            this.nameInput.warn()
            valid = false
        }

        if (!this.lfFileSelector.isPathValid() && this.lfFileSelector.path) {
            this.lfFileSelector.warn()
            valid = false
        }

        if (valid) {
            if (this.mode == Mode.ADD) {
                const soundboard = new Soundboard(this.nameInput.text, this.keysInput.keys, this.volumeSlider.value, this.lfFileSelector.path)
                this.dispatchEvent(new CustomEvent("add", { detail: { soundboard: soundboard } }))
            } else {
                this.soundboard.name = this.nameInput.text
                this.soundboard.keys = this.keysInput.keys
                this.soundboard.volume = this.volumeSlider.value
                this.soundboard.linkedFolder = this.lfFileSelector.path
                this.dispatchEvent(new CustomEvent("edit", { detail: { soundboard: this.soundboard } }))
            }
            this.close()
        }
    }

    removeSoundboard() {
        this.dispatchEvent(new CustomEvent("remove", { detail: { soundboard: this.soundboard } }))
        this.close()
    }
}

module.exports = SoundboardModal
module.exports.Mode = Mode
const Modal = require('./Modal.js')
const Slider = require('../Slider.js')
const TextField = require('../TextField.js')
const FileSelector = require('../FileSelector.js')
const KeyRecorder = require('../KeyRecorder.js')
const Sound = require('../../models/Sound.js')
const Toggler = require('../Toggler')
const InfoBalloon = require('../InfoBalloon.js')
const MS = require('../../models/MS.js')
const p = require('path')
const fs = require('fs')

const Mode = {
    ADD: 'add',
    EDIT: 'edit'
}

class SoundModal extends Modal {
    /**
     * @param {Mode} mode 
     * @param {Sound} sound 
     */
    constructor(mode, sound, path) {
        super()
        this.mode = mode
        this.path = path
        if (mode == Mode.ADD)
            super.title = "Add Sound"
        else {
            super.title = "Edit Sound"
            this.sound = sound
        }
    }

    getBodyElements() {
        this.nameField = new TextField("Name")
        this.moveToggle = new Toggler('Move sound', new InfoBalloon('The sound file will be moved to the location defined in Settings.'))
        this.pathSelector = new FileSelector("Path", FileSelector.FILE_TYPE, "Audio files", ['mp3', 'wav', 'ogg'])
        this.volumeSlider = new Slider()
        this.playKeyRecorder = new KeyRecorder()

        this.playKeyRecorder.addEventListener(KeyRecorder.EVENT_START_RECORDING, () => this.lockEsc = true)
        this.playKeyRecorder.addEventListener(KeyRecorder.EVENT_STOP_RECORDING, () => this.lockEsc = false)

        if (this.mode == Mode.EDIT) {
            this.nameField.text = this.sound.name
            this.pathSelector.path = this.sound.path
            this.volumeSlider.value = this.sound.volume
            this.playKeyRecorder.keys = this.sound.keys
        }

        this.pathSelector.addEventListener(FileSelector.EVENT_VALUE_CHANGED, (e) => {
            if (!this.nameField.text) this.nameField.text = this.pathSelector.getFileNameNoExtension()
        })

        const elems = [
            this.nameField,
            this.pathSelector,
            this.volumeSlider,
            Modal.getLabel("Play"),
            this.playKeyRecorder,
        ]

        if (this.mode == Mode.ADD) {
            this.pathSelector.path = this.path
            elems.splice(1, 0, this.moveToggle)
        }

        return elems
    }

    getFooterButtons() {
        let btnText = "add"
        if (this.mode == Mode.EDIT) {
            btnText = "save"
        }

        const buttons = [
            Modal.getButton("close", () => { this.close() }),
            Modal.getButton(btnText, () => { this.soundAction() })
        ]

        if (this.mode == Mode.EDIT) {
            buttons.unshift(Modal.getButton("remove", () => {
                this.removeSound()
            }, true, true))
        }

        return buttons
    }

    soundAction() {
        let valid = true
        if (!this.nameField.text || !this.nameField.text.trim()) {
            this.nameField.warn()
            valid = false
        }
        if (!this.pathSelector.path || !this.pathSelector.path.trim()) {
            this.pathSelector.warn()
            valid = false
        }

        if (valid) {
            if (!this.pathSelector.isPathValid()) {
                valid = false
                this.pathSelector.warn()
            }
        }

        if (valid) {
            if (this.mode == Mode.EDIT) {
                this.sound.name = this.nameField.text
                this.sound.path = this.pathSelector.path
                this.sound.volume = this.volumeSlider.value
                this.sound.keys = this.playKeyRecorder.keys
                this.dispatchEvent(new CustomEvent('edit', { detail: { sound: this.sound } }))
            } else {
                let file = this.pathSelector.path
                let folder = p.dirname(file)
                let moveFolder = MS.settings.getSoundsLocation()
                if (this.moveToggle.toggled && p.resolve(folder) != p.resolve(moveFolder)) {
                    let moveFile = MS.settings.getSoundsLocation() + '\\' + p.basename(file)

                    if (!fs.existsSync(moveFolder)) fs.mkdirSync(moveFolder)

                    let i = 2
                    let ext = p.extname(moveFile)
                    let newPath = moveFile
                    while (fs.existsSync(newPath)) {
                        newPath = moveFile.slice(0, -ext.length) + ' (' + i + ')' + ext
                        i++
                    }
                    moveFile = newPath

                    fs.copyFile(file, moveFile, (err) => {
                        if (!err) {
                            fs.unlink(file, () => { })
                            const sound = new Sound(this.nameField.text, moveFile, this.volumeSlider.value, this.playKeyRecorder.keys)
                            this.dispatchEvent(new CustomEvent('add', { detail: { sound: sound } }))
                        } else {
                            console.log(err)
                        }
                    })

                } else {
                    const sound = new Sound(this.nameField.text, file, this.volumeSlider.value, this.playKeyRecorder.keys)
                    this.dispatchEvent(new CustomEvent('add', { detail: { sound: sound } }))
                }
            }
            this.close()
        }
    }

    removeSound() {
        this.dispatchEvent(new CustomEvent('remove', { detail: { sound: this.sound } }))
        this.close()
    }
}

module.exports = SoundModal
module.exports.Mode = Mode
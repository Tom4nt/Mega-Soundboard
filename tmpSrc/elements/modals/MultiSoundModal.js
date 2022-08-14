const Modal = require('./Modal.js')
const Sound = require('../../models/Sound.js')
const Toggler = require('../Toggler')
const InfoBalloon = require('../InfoBalloon.js')
const MS = require('../../models/MS.js')
const p = require('path')
const fs = require('fs')

class MultiSoundModal extends Modal {
    constructor(paths) {
        super()
        this.sounds = []
        this.paths = paths
        super.title = 'Adding ' + paths.length + ' sounds'
    }

    getBodyElements() {
        this.moveToggle = new Toggler('Move sounds', new InfoBalloon('The sound files will be moved to the location defined in Settings.'))

        const elems = [
            this.moveToggle
        ]

        return elems
    }

    getFooterButtons() {
        const buttons = [
            Modal.getButton('close', () => { this.close() }),
            Modal.getButton('add', () => { this.okAction() })
        ]

        return buttons
    }

    okAction() {
        let moveFolder = MS.settings.getSoundsLocation()

        for (let i = 0; i < this.paths.length; i++) {
            const file = this.paths[i]
            const folder = p.dirname(file)
            const soundName = p.basename(file, p.extname(file))

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
                        const sound = new Sound(soundName, moveFile, 100, null)
                        this._tryFinish(sound)
                    } else {
                        console.log(err)
                        this.paths.splice(i, 1)
                        i--
                    }
                })

            } else {
                const sound = new Sound(soundName, file, 100, null)
                this._tryFinish(sound)
            }
        }
        this.close()
    }

    _tryFinish(sound) {
        this.sounds.push(sound)
        if (this.sounds.length >= this.paths.length) {
            this.dispatchEvent(new CustomEvent('add', { detail: { sounds: this.sounds } }))
        }
    }
}

module.exports = MultiSoundModal
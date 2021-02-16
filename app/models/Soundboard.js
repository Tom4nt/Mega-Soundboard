const Sound = require('./Sound.js');
const fs = require('fs');
const p = require('path');
const Utils = require('../models/Utils.js');

class Soundboard {
    constructor(name, keys, volume, linkedFolder) {
        this.name = name
        this.sounds = []
        this.keys = keys
        if (volume < 1) volume = 100
        this.volume = volume
        this.linkedFolder = linkedFolder
        if (linkedFolder) {
            this.updateFolderSounds()
            this.setupFolderListener()
        }
    }

    static fromSoundboardData(data) {
        const sb = new Soundboard()

        if (data.name) sb.name = data.name
        else sb.name = "¯\\_(ツ)_/¯"

        if (data.keys) sb.keys = data.keys

        if (data.volume) sb.volume = data.volume

        if (data.sounds) sb.sounds = this.getSoundsFromData(data.sounds, sb)

        if (data.linkedFolder) sb.linkedFolder = data.linkedFolder

        // Update sounds in this soundboard from the sounds in the linked folder
        if (sb.linkedFolder) {
            sb.updateFolderSounds()
            sb.setupFolderListener()
        }

        return sb
    }

    static getSoundsFromData(data, soundboard) {
        const sounds = []
        data.forEach(sound => {
            const s = Sound.fromData(sound, soundboard)
            sounds.push(s)
        });
        return sounds
    }

    updateFolderSounds() {
        if (!this.linkedFolder) return
        if (!fs.existsSync(this.linkedFolder)) return
        if (!fs.statSync(this.linkedFolder).isDirectory()) return

        let files = fs.readdirSync(this.linkedFolder)

        // Loop through files and add unexisting sounds
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const path = p.join(this.linkedFolder, file)
            if (Utils.isValidSoundFile(path)) {
                const soundWithPath = this.getSoundWithPath(path)
                if (!soundWithPath && fs.statSync(path).isFile()) {
                    this.sounds.push(new Sound(p.basename(file, p.extname(file)), path, 100, null, this))
                }
            }
        }

        // Loop through existing sounds and remove those without a file
        if (this.sounds.length > 0) {
            for (let i = this.sounds.length - 1; i >= 0; i--) {
                const sound = this.sounds[i]

                // Does the folder contain this sound?
                let contains = false
                files.forEach(file => {
                    const path = p.join(this.linkedFolder, file)
                    if (p.resolve(sound.path) == p.resolve(path)) contains = true
                });

                if (!contains) this.sounds.splice(i, 1)
            }
        }
    }

    setupFolderListener() {
        if (!this.linkedFolder) return
        if (!fs.existsSync(this.linkedFolder)) return
        if (!fs.statSync(this.linkedFolder).isDirectory()) return

        const folder = this.linkedFolder
        if (folder) {
            this.watcher = fs.watch(folder, (e, file) => {
                if (e != 'rename') return
                let path = p.join(folder, file)
                let exists = fs.existsSync(path)
                if (exists) {
                    let stats = fs.statSync(path)
                    if (!stats.isFile() || !Utils.isValidSoundFile(path)) return
                    console.log('Added ' + file)
                    const sound = new Sound(Utils.getNameFromFile(file), path, 100, null, this)
                    const detail = { soundboard: this, sound: sound }
                    Soundboard.eventDispatcher.dispatchEvent(new CustomEvent(Soundboard.events.ADDED_TO_FOLDER, { detail }))
                }
                else {
                    if (!Utils.isValidSoundFile(path)) return
                    const sound = this.getSoundWithPath(path)
                    if (sound) {
                        console.log('Removed ' + file)
                        const detail = { soundboard: this, sound: sound }
                        Soundboard.eventDispatcher.dispatchEvent(new CustomEvent(Soundboard.events.REMOVED_FROM_FOLDER, { detail }))
                    }
                }
            })
        }
    }

    removeFolderListener() {
        if (this.watcher) this.watcher.close()
    }

    getSoundWithPath(path) {
        for (let i = 0; i < this.sounds.length; i++) {
            const sound = this.sounds[i]
            if (p.resolve(sound.path) == p.resolve(path)) return sound
        }
        return null
    }

    addSound(sound, index) {
        if (index === undefined || index === null) this.sounds.push(sound)
        else this.sounds.splice(index, 0, sound)
    }

    removeSound(sound) {
        this.sounds.splice(this.sounds.indexOf(sound), 1)
    }
}

Soundboard.events = {}
Soundboard.events.REMOVED_FROM_FOLDER = 'removedfromfolder'
Soundboard.events.ADDED_TO_FOLDER = 'addedtofolder'

Soundboard.eventDispatcher = new EventTarget()

module.exports = Soundboard
const KeybindManager = require('../models/KeybindManager.js')
const Sound = require('../models/Sound.js')
const Keys = require('../models/Keys.js')
const MS = require('../models/MS.js')
const SoundModal = require('./modals/SoundModal.js')
const Modal = require('./modals/Modal.js')

const NO_KEYBIND = "Right click to add a keybind"
const NO_SOUNDS = "This soundboard has no sounds"
const SEARCH_EMPTY = "No sounds with the current filter"

module.exports = class SoundList extends HTMLElement {
    constructor() {
        super()
        this._filter = ""
        this.sounds = []
    }

    get filter() {
        return this._filter
    }

    set filter(text) {
        this._filter = text
        this._filterSounds(this.sounds)
    }

    connectedCallback() {
        const empty = document.createElement("span")
        empty.classList.add("soundlist-empty")
        this.emptyIndicator = empty
        const itemsContainer = document.createElement("div")
        this.items = itemsContainer

        const dragDummy = document.createElement('div')
        dragDummy.classList.add('soundlist-item')
        dragDummy.classList.add('dragdummy')

        itemsContainer.append(dragDummy)

        this.append(empty, itemsContainer)
    }

    /**
     * Adds a sound to the list.
     * @param {Sound} sound 
     */
    addSound(sound) {
        this.emptyIndicator.style.display = "none"
        const item = document.createElement("div")
        item.classList.add("soundlist-item")

        const title = document.createElement("span")
        title.innerHTML = sound.name

        const desc = document.createElement("span")
        desc.classList.add("soundlist-item-desc")
        if (sound.keys) desc.innerHTML = Keys.toKeyString(sound.keys)
        else desc.innerHTML = NO_KEYBIND

        item.sound = sound
        item.append(title, desc)

        item.addEventListener("click", () => {
            if (!MS.playSound(sound)) {
                new Modal("Could not play",
                    `'${sound.path}' could not be found. It was moved, deleted or perhaps never existed...<br/>
                    If the file exists make sure Mega Soundboard has permission to access it.`).open()
                MS.playUISound(MS.SOUND_ERR)
            }
        })

        item.addEventListener("contextmenu", () => {
            const sb = MS.getSelectedSoundboard()
            const modal = new SoundModal(SoundModal.Mode.EDIT, sound)
            modal.open()
            modal.addEventListener("edit", (e) => {
                item.childNodes[0].innerHTML = e.detail.sound.name
                if (e.detail.sound.keys) item.childNodes[1].innerHTML = Keys.toKeyString(e.detail.sound.keys)
                else item.childNodes[1].innerHTML = NO_KEYBIND
                KeybindManager.registerSound(sound)
                sound.soundboard = sb
                MS.data.save()
            })
            modal.addEventListener("remove", (e) => {
                item.remove()
                if (this.items.childElementCount < 1) this._displayNoSoundsMessage(NO_SOUNDS)
                KeybindManager.unregisterSound(sound)
                MS.getSelectedSoundboard().removeSound(sound)
                MS.data.save()
            })
        })

        this.items.appendChild(item)
    }

    setSounds(sounds) {
        this.sounds = sounds
        if (sounds.length < 1) {
            this.clear()
            return;
        } else {
            this._filterSounds(sounds)
        }
    }

    _filterSounds(sounds) {
        if (!sounds.length) {
            this._displayNoSoundsMessage(NO_SOUNDS)
            return;
        }
        this._removeAll()
        this.emptyIndicator.style.display = "none"
        let hasSounds = false
        sounds.forEach(sound => {
            if (!this.filter || sound.name.includes(this.filter)) {
                this.addSound(sound)
                hasSounds = true
            }
        });
        if (!hasSounds) this._displayNoSoundsMessage(SEARCH_EMPTY)
    }

    clear() {
        this._displayNoSoundsMessage(NO_SOUNDS)
        this._removeAll()
    }

    _removeAll() {
        let child = this.items.lastElementChild;
        while (child && !child.classList.contains('dragdummy')) {
            if (!child.classList.contains('dragdummy')) {
                this.items.removeChild(child);
            }
            child = this.items.lastElementChild;
        }
    }

    _displayNoSoundsMessage(message) {
        if (!message) this.emptyIndicator.style.display = "none"
        this.emptyIndicator.style.display = null // Default display
        this.emptyIndicator.innerHTML = message
    }
}
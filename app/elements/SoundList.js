const KeybindManager = require('../models/KeybindManager.js')
const Sound = require('../models/Sound.js')
const Keys = require('../models/Keys.js')
const MS = require('../models/MS.js')
const SoundModal = require('./modals/SoundModal.js')
const Modal = require('./modals/Modal.js')

const NO_KEYBIND = 'Right click to add a keybind'
const NO_SOUNDS = 'This soundboard has no sounds'
const SEARCH_EMPTY = 'No sounds with the current filter'
const DRAG_START_OFFSET = 10

module.exports = class SoundList extends HTMLElement {
    constructor() {
        super()
        this._filter = ''
        this.sounds = []
        this.dragElem = null
    }

    get filter() {
        return this._filter
    }

    set filter(text) {
        this._filter = text
        this._filterSounds(this.sounds)
    }

    connectedCallback() {
        const infoSpan = document.createElement('span')
        infoSpan.classList.add('info')
        this.infoSpan = infoSpan
        const itemsContainer = document.createElement('div')
        itemsContainer.classList.add('itemcontainer')
        this.items = itemsContainer

        const dragDummy = document.createElement('div')
        dragDummy.classList.add('item')
        dragDummy.classList.add('dragdummy')
        this.dragDummy = dragDummy

        itemsContainer.append(dragDummy)

        this.append(infoSpan, itemsContainer)

        document.addEventListener('mousemove', (e) => this._onMouseMove(e))
        document.addEventListener('mouseup', (e) => this._onMouseUp(e))

        MS.eventDispatcher.addEventListener(MS.EVENT_SOUND_PLAY, (e) => {
            const sound = e.detail
            const elem = this._getSoundElement(sound)
            this._setElementPlayingState(elem, true)
        })

        MS.eventDispatcher.addEventListener(MS.EVENT_SOUND_STOP, (e) => {
            const sound = e.detail
            const elem = this._getSoundElement(sound)
            this._setElementPlayingState(elem, false)
        })

        MS.eventDispatcher.addEventListener(MS.EVENT_STOP_ALL_SOUNDS, () => {
            for (let i = 0; i < this.items.childElementCount; i++) {
                const elem = this.items.childNodes[i]
                this._setElementPlayingState(elem, false)
            }
        })
    }

    /**
     * Adds a sound to the list.
     * @param {Sound} sound 
     */
    addSound(sound, index) {
        this.infoSpan.style.display = 'none'
        const item = document.createElement('div')
        item.classList.add('item')

        const title = document.createElement('span')
        title.innerHTML = sound.name

        const desc = document.createElement('span')
        desc.classList.add('desc')
        if (sound.keys) desc.innerHTML = Keys.toKeyString(sound.keys)
        else desc.innerHTML = NO_KEYBIND

        const playingIndicator = document.createElement('div')
        playingIndicator.classList.add('indicator')

        item.sound = sound
        item.append(title, desc, playingIndicator)

        item.addEventListener('click', (e) => {
            if (e.target === playingIndicator) return
            MS.playSound(sound).catch(
                (err) => {
                    new Modal('Could not play', err).open()
                    MS.playUISound(MS.SOUND_ERR)
                }
            )
        })

        item.addEventListener('auxclick', (e) => {
            if (e.button === 1) MS.stopSound(sound)
        })

        playingIndicator.addEventListener('click', () => {
            MS.stopSound(sound)
        })

        item.addEventListener('contextmenu', () => {
            const sb = MS.getSelectedSoundboard()
            const modal = new SoundModal(SoundModal.Mode.EDIT, sound)
            modal.open()
            modal.addEventListener('edit', (e) => {
                item.childNodes[0].innerHTML = e.detail.sound.name
                if (e.detail.sound.keys) item.childNodes[1].innerHTML = Keys.toKeyString(e.detail.sound.keys)
                else item.childNodes[1].innerHTML = NO_KEYBIND
                KeybindManager.registerSound(sound)
                sound.soundboard = sb
                MS.data.save()
            })
            modal.addEventListener('remove', (e) => {
                item.remove()
                MS.stopSound(this.sound)
                if (!this.hasSounds()) this._displayNoSoundsMessage(NO_SOUNDS)
                KeybindManager.unregisterSound(sound)
                MS.getSelectedSoundboard().removeSound(sound)
                MS.data.save()
            })
        })

        item.addEventListener('mousedown', (e) => {
            if (e.button != 0) return
            const elem = item
            this.dragElem = elem
            this.initialIndex = MS.getSelectedSoundboard().sounds.indexOf(elem.sound)
            this.initialSoundboard = MS.getSelectedSoundboard()

            let offsetY = e.offsetY
            let offsetX = e.offsetX
            if (!e.target.classList.contains('item')) {
                offsetY = e.offsetY + e.target.offsetTop //- e.target.parentElement.offsetTop
                offsetX = e.offsetX + e.target.offsetLeft //- e.target.parentElement.offsetLeft
            }

            elem.offsetX = offsetX + parseInt(getComputedStyle(elem).marginLeft)
            elem.offsetY = offsetY + parseInt(getComputedStyle(elem).marginTop)

            elem.initialX = e.clientX
            elem.initialY = e.clientY

            this.dragging = true
        })

        if (index === undefined || index === null)
            this.items.appendChild(item)
        else
            this.items.insertBefore(item, this.items.childNodes[index])
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

    hasSounds() {
        return this.items.childElementCount > 1 // Drag dummy doesn't count
    }

    handleFileDrag(e) {
        if (e.dataTransfer.items.length < 1) return

        // Is there any compatible sound file?
        let valid = false
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
            const item = e.dataTransfer.items[i]
            if (this._isFileTypeCompatible(item.type)) {
                valid = true
                break
            }
        }

        if (!valid) return

        console.log(e.dataTransfer.items.length)

        this.dragging = true

        let below = document.elementFromPoint(e.clientX, e.clientY)
        if (!this.dragOK) {
            this.dragDummy.style.display = 'inline-block'
            this.dragOK = true
        }

        if (below) {
            if (below.parentElement === this.items || below.parentElement.parentElement === this.items) {
                if (below.parentElement.parentElement === this.items) below = below.parentElement
                if (MS.getElementIndex(soundList.dragDummy) > MS.getElementIndex(below)) {
                    soundList.items.insertBefore(soundList.dragDummy, below)
                } else {
                    soundList.items.insertBefore(soundList.dragDummy, below.nextElementSibling)
                }
            }
            if (below.parentElement.id == 'soundboardlist') {
                let soundboard = below.soundboard
                this.dispatchEvent(new CustomEvent('soundboardselect', { detail: { soundboard } }))
            }
        }
    }

    endFileDrag(e) {
        this.dragging = false
        this.dragOK = false
        this.dragDummy.style.display = null

        if (!e) { // Ends without adding sound(s)
            console.log('File(s) dragging cancelled')
            return
        }

        const index = MS.getElementIndex(this.dragDummy)
        const sb = MS.getSelectedSoundboard()

        const soundModal = new SoundModal(SoundModal.Mode.ADD, null, e.dataTransfer.files[0].path, index)
        soundModal.open()
        soundModal.addEventListener('add', (e) => {
            const sound = e.detail.sound
            sound.soundboard = sb
            KeybindManager.registerSound(sound)
            sb.sounds.splice(index, 0, sound)
            this.addSound(sound, index)
            MS.data.save()
        })
    }

    _isFileTypeCompatible(type) {
        return type === 'audio/mpeg' || type === 'audio/ogg' || type === 'audio/wav'
    }

    _filterSounds(sounds) {
        if (!sounds.length) {
            this._displayNoSoundsMessage(NO_SOUNDS)
            return;
        }
        this._removeAll()
        this.infoSpan.style.display = "none"
        let hasSounds = false
        sounds.forEach(sound => {
            if (!this.filter || sound.name.toLowerCase().includes(this.filter.toLowerCase())) {
                if (!this.dragOK || (!this.dragElem || sound != this.dragElem.sound)) {
                    this.addSound(sound)
                    hasSounds = true
                }
            }
        });
        this._updatePlayingStates()
        if (!hasSounds && !this.dragOK) this._displayNoSoundsMessage(SEARCH_EMPTY)
    }

    clear() {
        if (!this.dragOK) this._displayNoSoundsMessage(NO_SOUNDS)
        this._removeAll()
    }

    _removeAll() {
        let count = this.items.children.length;
        for (let i = count - 1; i >= 0; i--) {
            let elem = this.items.children.item(i)
            if (!elem.classList.contains('dragdummy') && !elem.classList.contains('drag')) elem.remove()
        }
    }

    _displayNoSoundsMessage(message) {
        if (!message) this.infoSpan.style.display = "none"
        this.infoSpan.style.display = null // Default display
        this.infoSpan.innerHTML = message
    }

    /**
     * Returns an element from the list for a specified sound.
     * Returns null if the element is not found.
     * @param {Sound} sound 
     * @returns {HTMLElement}
     */
    _getSoundElement(sound) {
        for (let i = 0; i < this.items.childElementCount; i++) {
            let elem = this.items.childNodes[i]
            if (elem.sound === sound) return elem
        }
        return null
    }

    /**
     * Sets the element style to represent if it's sound is playing or not.
     * @param {HTMLElement} element
     */
    _setElementPlayingState(element, playingState) {
        if (!element || element.classList.contains('dragdummy')) return
        if (playingState) {
            element.childNodes[2].style.top = '-11px'
            element.childNodes[2].style.right = '-11px'
        } else {
            element.childNodes[2].style.top = null
            element.childNodes[2].style.right = null
        }
    }

    /**
     * Updates the displayed playing states on the list elements based on currently playing sounds.
     */
    _updatePlayingStates() {
        const playing = MS.playingSounds
        for (let i = 0; i < playing.length; i++) {
            const elem = this._getSoundElement(playing[i])
            if (elem) this._setElementPlayingState(elem, true)
        }
    }

    _onMouseMove(e) {
        const d = this.dragElem
        if (!d) return;
        if ((Math.abs(d.initialX - e.clientX) > DRAG_START_OFFSET || Math.abs(d.initialY - e.clientY) > DRAG_START_OFFSET || this.dragOK) && this.dragging) {
            if (!this.dragOK) {
                d.style.width = d.offsetWidth + 'px'

                d.style.position = 'fixed'
                d.style.pointerEvents = 'none'

                d.style.top = e.clientY - d.offsetY + 'px'
                d.style.left = e.clientX - d.offsetX + 'px'

                d.style.zIndex = 1

                this.items.insertBefore(this.dragDummy, d.nextSibling)
                this.dragDummy.style.display = 'inline-block'
                this.dragOK = true
            }

            d.classList.add('drag')
            d.style.top = e.clientY - d.offsetY + 'px'
            d.style.left = e.clientX - d.offsetX + 'px'
            let curr = document.elementFromPoint(e.clientX, e.clientY)
            if (curr) {
                if (curr.parentElement === this.items || curr.parentElement.parentElement === this.items) {
                    if (curr.parentElement.parentElement === this.items) curr = curr.parentElement
                    if (MS.getElementIndex(soundList.dragDummy) > MS.getElementIndex(curr)) {
                        soundList.items.insertBefore(soundList.dragDummy, curr)
                    } else {
                        soundList.items.insertBefore(soundList.dragDummy, curr.nextElementSibling)
                    }
                }
                if (curr.parentElement.id == 'soundboardlist') {
                    let soundboard = curr.soundboard
                    this.dispatchEvent(new CustomEvent('soundboardselect', { detail: { soundboard } }))
                }
            }
        }
    }

    _onMouseUp(e) {
        this.dragging = false
        const d = this.dragElem
        if (!d) return;
        if (d != null && this.dragOK) {
            d.style.position = null
            this.items.insertBefore(d, this.dragDummy.nextElementSibling)
            void d.offsetWidth // Trigger Reflow
            d.classList.remove('drag')
            d.style.pointerEvents = null
            d.style.width = null
            d.style.top = null
            d.style.left = null
            d.style.zIndex = null
            this.dragElem = null
            this.dragDummy.style.display = 'none'
            this.dragOK = false
            const newIndex = MS.getElementIndex(d) - 1
            if (this.initialIndex != newIndex || this.initialSoundboard != MS.getSelectedSoundboard()) {
                this._reorderSound(this.initialIndex, newIndex)
            }
        }
    }

    _reorderSound(oldIndex, newIndex) {
        const initSBSounds = this.initialSoundboard.sounds
        const currSBSounds = MS.getSelectedSoundboard().sounds
        const sound = initSBSounds[oldIndex]

        initSBSounds.splice(oldIndex, 1);
        currSBSounds.splice(newIndex, 0, sound);

        // Register keybind again if it's a different soundboard
        if (this.initialSoundboard != MS.getSelectedSoundboard().sounds) {
            sound.soundboard = MS.getSelectedSoundboard()
            KeybindManager.registerSound(sound)
        }

        MS.data.save();

        this.dispatchEvent(new CustomEvent('reorder', {
            detail: {
                sound,
                oldIndex,
                newIndex,
                oldSoundboard: this.initialSoundboard,
                newSoundboard: MS.getSelectedSoundboard()
            }
        }))
    }
}
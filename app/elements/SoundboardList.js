const MS = require("../models/MS.js")
const Utils = require('../models/Utils.js');
const SoundboardModal = require("./modals/SoundboardModal.js")
const KeybindManager = require("../models/KeybindManager.js")
const Soundboard = require("../models/Soundboard.js")
const Keys = require("../models/Keys.js")
const fs = require('fs');

const DRAG_START_OFFSET = 10

module.exports = class SoundboardList extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        // Add drag dummy item
        const item = document.createElement('div')
        item.classList.add('item', 'dragdummy')
        this.dragDummy = item
        this.appendChild(item)

        MS.eventDispatcher.addEventListener(MS.EVENT_SOUND_PLAY, (e) => {
            const elem = this._getSoundboardElement(e.detail.soundboard)
            this._updatePlayingIndicator(elem, 1)
        })

        MS.eventDispatcher.addEventListener(MS.EVENT_SOUND_STOP, (e) => {
            const elem = this._getSoundboardElement(e.detail.soundboard)
            this._updatePlayingIndicator(elem, -1)
        })

        MS.eventDispatcher.addEventListener(MS.EVENT_STOP_ALL_SOUNDS, () => { this._setAllPlayingIndicators(false) })

        this.onmousedown = (e) => {
            if (e.button === 1) return false
        }

        document.addEventListener('mousemove', (e) => this._mouseMove(e))
        document.addEventListener('mouseup', (e) => this._mouseUp(e))
    }

    /**
     * Adds a Soundboard to the list.
     * @param {Soundboard} soundboard 
     */
    addSoundboard(soundboard) {
        const item = document.createElement('div')
        item.classList.add('item')
        if (soundboard.linkedFolder) item.classList.add('linked')
        item.soundboard = soundboard

        const indicator = document.createElement('div')
        indicator.classList.add('indicator')
        item.indicator = indicator

        const title = document.createElement('span')
        title.classList.add('title')
        title.innerHTML = soundboard.name
        item.titleElement = title

        const desc = document.createElement('span')
        if (soundboard.keys) desc.innerHTML = Keys.toKeyString(soundboard.keys)
        desc.classList.add('desc')

        const icon = document.createElement('span')
        if (soundboard.linkedFolder) icon.innerHTML = 'link'
        icon.classList.add('icon')
        MS.addPopup('This soundboard is linked to a folder', icon)

        item.append(indicator, title, desc, icon)

        item.addEventListener('click', () => {
            if (!item.classList.contains('selected')) {
                this.select(item)
            }
        })

        item.addEventListener('auxclick', (e) => {
            if (e.button === 1) {
                MS.stopSounds(item.soundboard)
            }
        })

        item.addEventListener('contextmenu', () => {
            const editModal = new SoundboardModal(SoundboardModal.Mode.EDIT, item.soundboard, MS.data.soundboards.length < 2)
            editModal.open()
            editModal.addEventListener('edit', (e) => {
                item.soundboard = e.detail.soundboard
                KeybindManager.registerSoundboardn(item.soundboard)
                this.updateSoundboard(item)
                if (item.soundboard.linkedFolder) {
                    item.soundboard.updateFolderSounds()
                    item.soundboard.removeFolderListener()
                    item.soundboard.setupFolderListener()
                    if (MS.getSelectedSoundboard() === item.soundboard) this.select(item)
                }
                MS.data.save()
            })
            editModal.addEventListener('remove', (e) => {
                item.remove()
                MS.data.removeSoundboard(e.detail.soundboard)
                if (!MS.getSelectedSoundboard()) {
                    MS.setSelectedSoundboard(0)
                    this.selectSoundboardAt(0)
                } else {
                    this.selectSoundboardAt(MS.settings.selectedSoundboard)
                }
                MS.data.save()
            })
        })

        item.addEventListener('mousedown', (e) => this._itemMouseDown(e, item))

        this.appendChild(item)
    }

    updateSoundboard(item) {
        item.childNodes[1].innerHTML = item.soundboard.name
        item.classList.remove('linked')
        if (item.soundboard.linkedFolder) item.classList.add('linked')
        if (item.soundboard.keys) item.childNodes[2].innerHTML = Keys.toKeyString(item.soundboard.keys)
        else item.childNodes[2].innerHTML = null
        item.childNodes[3].innerHTML = item.soundboard.linkedFolder ? 'link' : null
    }

    selectSoundboard(soundboard) {
        this.childNodes.forEach(i => {
            if (i.soundboard == soundboard) {
                this.select(i)
                return;
            }
        });
    }

    select(element) {
        if (!element) {
            this.selectSoundboardAt(0);
            return
        }
        this.dispatchEvent(new CustomEvent("soundboardselect", { detail: { soundboard: element.soundboard } }))
        this.childNodes.forEach(i => {
            i.classList.remove("selected")
        });
        element.classList.add("selected")
    }

    selectSoundboardAt(index) {
        this.selectSoundboard(MS.data.soundboards[index])
    }

    /**
     * Updates the information about playing sounds in a soundboard.
     */
    incrementPlayingSound(soundboard, increment) {
        const elem = this._getSoundboardElement(soundboard)
        if (!elem) return
        this._updatePlayingIndicator(elem, increment)
    }

    /**
     * Updates the playing indicator of an element in the list.
     * @param {Number} playingSoundsIncrement Increments the currently playing sounds on the specified element (thus soundboard). Can be negative.
     */
    _updatePlayingIndicator(element, playingSoundsIncrement) {
        if (element.playingSounds) element.playingSounds += playingSoundsIncrement
        else element.playingSounds = playingSoundsIncrement

        if (element.playingSounds < 0) element.playingSounds = 0 // Not supposed to happen

        this._setPlayingIndicatorState(element, element.playingSounds > 0)
    }

    /**
     * Sets all playing indicators to a specific state.
     */
    _setAllPlayingIndicators(state) {
        for (let i = 0; i < this.childElementCount; i++) {
            const elem = this.childNodes[i]
            if (elem !== this.dragDummy) {
                elem.playingSounds = null
                this._setPlayingIndicatorState(elem, state)
            }
        }
    }

    /**
     * Sets the current playing indicator state for an element of the list.
     */
    _setPlayingIndicatorState(element, state) {
        if (!element.titleElement) return
        if (state) {
            element.titleElement.style.fontWeight = '1000'
        } else {
            element.titleElement.style.fontWeight = null
        }
    }

    /**
     * Returns the element from the list representing a specific soundboard.
     * Returns null if no element is found.
     */
    _getSoundboardElement(soundboard) {
        if (!soundboard) return null
        for (let i = 0; i < this.childElementCount; i++) {
            const elem = this.childNodes[i]
            if (elem.soundboard === soundboard) return elem
        }
        return null
    }

    //#region Drag Functions

    _itemMouseDown(e, item) {
        if (e.button != 0) return
        this.dragElem = item
        this.initialIndex = MS.data.soundboards.indexOf(item.soundboard)

        let offsetY = e.offsetY
        if (!e.target.classList.contains('item')) {
            offsetY = e.offsetY + e.target.offsetTop
        }

        item.offsetY = offsetY + parseInt(getComputedStyle(item).marginTop)

        item.initialY = e.clientY

        this.dragging = true
    }

    _mouseMove(e) {
        const d = this.dragElem
        if (!d) return;
        if ((Math.abs(d.initialY - e.clientY) > DRAG_START_OFFSET || this.dragOK) && this.dragging) {
            if (!this.dragOK) {
                d.style.width = d.offsetWidth + 'px'

                d.style.position = 'fixed'
                d.style.pointerEvents = 'none'

                d.style.top = e.clientY - d.offsetY + 'px'

                d.style.zIndex = 1

                this.insertBefore(this.dragDummy, d.nextSibling)
                this.dragDummy.style.display = 'inline-block'
                this.dragOK = true
            }

            d.classList.add('drag')
            d.style.top = e.clientY - d.offsetY + 'px'
            let curr = document.elementFromPoint(d.getBoundingClientRect().x, e.clientY)
            if (curr) {
                if (curr.parentElement === this || curr.parentElement.parentElement === this) {
                    if (curr.parentElement.parentElement === this) curr = curr.parentElement
                    if (Utils.getElementIndex(this.dragDummy) > Utils.getElementIndex(curr)) {
                        this.insertBefore(this.dragDummy, curr)
                    } else {
                        this.insertBefore(this.dragDummy, curr.nextElementSibling)
                    }
                }
            }
        }
    }

    _mouseUp(e) {
        this.dragging = false
        const d = this.dragElem
        if (!d) return;
        if (d != null && this.dragOK) {
            d.style.position = null
            this.insertBefore(d, this.dragDummy.nextElementSibling)
            void d.offsetWidth // Trigger Reflow
            d.classList.remove('drag')
            d.style.pointerEvents = null
            d.style.width = null
            d.style.top = null
            d.style.zIndex = null
            this.dragElem = null
            this.dragDummy.style.display = 'none'
            this.dragOK = false
            const newIndex = Utils.getElementIndex(d) - 1
            if (this.initialIndex != newIndex || this.initialSoundboard != MS.getSelectedSoundboard())
                this._reorder(this.initialIndex, newIndex)
        }
    }

    _reorder(oldIndex, newIndex) {
        const sb = MS.data.soundboards[oldIndex]
        const selectedSB = MS.getSelectedSoundboard()

        MS.data.soundboards.splice(oldIndex, 1);
        MS.data.soundboards.splice(newIndex, 0, sb);

        MS.setSelectedSoundboard(selectedSB)
        MS.data.save()
        MS.settings.save()
    }

    //#endregion
}
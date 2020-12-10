const MS = require("../models/MS.js")
const SoundboardModal = require("./modals/SoundboardModal.js")
const KeybindManager = require("../models/KeybindManager.js")
const Soundboard = require("../models/Soundboard.js")
const Keys = require("../models/Keys.js")

module.exports = class SoundboardList extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {}

    /**
     * Adds a Soundboard to the list.
     * @param {Soundboard} soundboard 
     */
    addSoundboard(soundboard) {
        const item = document.createElement("div")
        item.classList.add("soundboardlist-item")
        item.soundboard = soundboard

        const indicator = document.createElement("div")
        indicator.classList.add("soundboardlist-item-indicator")

        const title = document.createElement("span")
        title.classList.add("soundboardlist-item-title")
        title.innerHTML = soundboard.name

        const desc = document.createElement("span")
        if (soundboard.keys) desc.innerHTML = Keys.toKeyString(soundboard.keys)
        desc.classList.add("soundboardlist-item-desc")

        item.append(indicator, title, desc)

        item.addEventListener("click", () => {
            if (!item.classList.contains("selected")) {
                this.select(item)
            }
        })

        item.addEventListener("contextmenu", () => {
            const editModal = new SoundboardModal(SoundboardModal.Mode.EDIT, item.soundboard, MS.data.soundboards.length < 2)
            editModal.open()
            editModal.addEventListener("edit", (e) => {
                item.soundboard = e.detail.soundboard
                KeybindManager.registerSoundboardn(item.soundboard)
                this.updateSoundboard(item)
                MS.data.save()
            })
            editModal.addEventListener("remove", (e) => {
                item.remove()
                MS.data.removeSoundboard(e.detail.soundboard)
                console.log(MS.getSelectedSoundboard())
                if (!MS.getSelectedSoundboard()) {
                    MS.setSelectedSoundboard(0)
                    this.selectIndex(0)
                } else {
                    this.selectIndex(MS.settings.selectedSoundboard)
                }
                MS.data.save()
            })
        })

        this.appendChild(item)
    }

    updateSoundboard(item) {
        item.childNodes[1].innerHTML = item.soundboard.name
        if (item.soundboard.keys) item.childNodes[2].innerHTML = Keys.toKeyString(item.soundboard.keys)
        else item.childNodes[2].innerHTML = null
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
            this.selectIndex(0);
            return
        }
        this.dispatchEvent(new CustomEvent("soundboardselect", { detail: { soundboard: element.soundboard } }))
        this.childNodes.forEach(i => {
            i.classList.remove("selected")
        });
        element.classList.add("selected")
    }

    selectIndex(index) {
        this.select(this.childNodes[index])
    }
}
import { Keys, MS, Sound, UISoundPath } from "../Models";
import { Modals } from '../Elements';

const NO_KEYBIND = "Right click to add a keybind";
const NO_SOUNDS = "This soundboard has no sounds";
const SEARCH_EMPTY = "No sounds with the current filter";
const DRAG_START_OFFSET = 10;

export default class SoundList extends HTMLElement {
    sounds: Sound[] = [];

    private dragElement: HTMLDivElement | null = null;
    private infoElement: HTMLSpanElement | null = null;
    private containerElement: HTMLDivElement | null = null;
    private dragDummyElement: HTMLDivElement | null = null;
    private canAdd = true;

    private _filter = "";
    get filter(): string {
        return this._filter;
    }
    set filter(text: string) {
        this._filter = text;
        this._filterSounds(this.sounds);
    }

    protected connectedCallback(): void {
        const infoSpan = document.createElement("span");
        infoSpan.classList.add("info");
        this.infoElement = infoSpan;

        const itemsContainer = document.createElement("div");
        itemsContainer.classList.add("itemcontainer");
        this.containerElement = itemsContainer;

        const dragDummy = document.createElement("div");
        dragDummy.classList.add("item");
        dragDummy.classList.add("dragdummy");
        this.dragDummyElement = dragDummy;

        itemsContainer.append(dragDummy);

        this.append(infoSpan, itemsContainer);

        document.addEventListener("mousemove", (e) => this._onMouseMove(e));
        document.addEventListener("mouseup", (e) => this._onMouseUp(e));

        this.onmousedown = (e): boolean => {
            if (e.button === 1) return false;
            return true;
        };

        MS.instance.onPlaySound.addHandler(sound => {
            const elem = this.getSoundElement(sound);
            this._setElementPlayingState(elem, true);
        });

        MS.instance.onStopSound.addHandler(sound => {
            const elem = this.getSoundElement(sound);
            this._setElementPlayingState(elem, false);
        });

        MS.instance.onStopAllSounds.addHandler(() => {
            if (!this.containerElement) return;
            for (let i = 0; i < this.containerElement.childElementCount; i++) {
                const elem = this.containerElement.childNodes[i];
                this._setElementPlayingState(elem, false);
            }
        });
    }

    addSound(sound: Sound, index: number): void {
        if (this.infoElement) this.infoElement.style.display = "none";
        const item = document.createElement("div");
        item.classList.add("item");

        const title = document.createElement("span");
        title.innerHTML = sound.name;

        const desc = document.createElement("span");
        desc.classList.add("desc");
        if (sound.keys) desc.innerHTML = Keys.toKeyString(sound.keys);
        else desc.innerHTML = NO_KEYBIND;

        const playingIndicator = document.createElement("div");
        playingIndicator.classList.add("indicator");

        item.sound = sound;
        item.append(title, desc, playingIndicator);

        const handleSoundClick = async (e: MouseEvent): Promise<void> => {
            if (e.target === playingIndicator) return;
            try {
                await MS.instance.playSound(sound);
            } catch (error) {
                new Modals.Modal("Could not play", error, true).open();
                await MS.instance.playUISound(UISoundPath.ERROR);
            }
        };

        item.addEventListener("click", (e) => void handleSoundClick(e));

        item.addEventListener("auxclick", (e) => {
            if (e.button === 1) {
                MS.instance.stopSound(sound);
            }
        });

        playingIndicator.addEventListener("click", () => {
            MS.instance.stopSound(sound);
        });

        item.addEventListener("contextmenu", () => {
            const sb = MS.instance.getSelectedSoundboard();
            const modal = new Modals.SoundModal(SoundModal.Mode.EDIT, sound);
            modal.open();
            modal.addEventListener("edit", (e) => {
                item.childNodes[0].innerHTML = e.detail.sound.name;
                if (e.detail.sound.keys) item.childNodes[1].innerHTML = Keys.toKeyString(e.detail.sound.keys);
                else item.childNodes[1].innerHTML = NO_KEYBIND;
                KeybindManager.registerSound(sound);
                sound.soundboard = sb;
                MS.data.save();
            });
            modal.addEventListener("remove", (e) => {
                item.remove();
                MS.stopSound(this.sound);
                if (!this.hasSounds()) this._displayNoSoundsMessage(NO_SOUNDS);
                KeybindManager.unregisterSound(sound);
                MS.getSelectedSoundboard().removeSound(sound);
                MS.data.save();
            });
        });

        item.addEventListener("mousedown", (e) => {
            if (e.button != 0) return;
            const elem = item;
            this.dragElem = elem;
            this.initialIndex = MS.getSelectedSoundboard().sounds.indexOf(elem.sound);
            this.initialSoundboard = MS.getSelectedSoundboard();

            let offsetY = e.offsetY;
            let offsetX = e.offsetX;
            if (!e.target.classList.contains("item")) {
                offsetY = e.offsetY + e.target.offsetTop; //- e.target.parentElement.offsetTop
                offsetX = e.offsetX + e.target.offsetLeft; //- e.target.parentElement.offsetLeft
            }

            elem.offsetX = offsetX + parseInt(getComputedStyle(elem).marginLeft);
            elem.offsetY = offsetY + parseInt(getComputedStyle(elem).marginTop);

            elem.initialX = e.clientX;
            elem.initialY = e.clientY;

            this.dragging = true;
        });

        if (index === undefined || index === null)
            this.items.appendChild(item);
        else
            this.items.insertBefore(item, this.items.childNodes[index]);
    }

    removeSound(sound) {
        for (let i = 0; i < this.items.childElementCount; i++) {
            const item = this.items.children[i];
            if (item.sound === sound) {
                item.remove();
                if (!this.hasSounds()) this._displayNoSoundsMessage(NO_SOUNDS);
                return;
            }
        }
    }

    setSounds(sounds) {
        this.sounds = sounds;
        if (sounds.length < 1) {
            this.clear();
            return;
        } else {
            this._filterSounds(sounds);
        }
    }

    hasSounds() {
        return this.items.childElementCount > 1; // Drag dummy doesn't count
    }

    handleFileDrag(e) {
        if (e.dataTransfer.items.length < 1) return;

        // Is there any compatible sound file?
        let valid = false;
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
            const item = e.dataTransfer.items[i];
            if (this._isFileTypeCompatible(item.type)) {
                valid = true;
                break;
            }
        }

        if (!valid) return;

        this.dragging = true;

        let below = document.elementFromPoint(e.clientX, e.clientY);
        if (!this.dragOK && !this.blockAdd) {
            this.dragDummy.style.display = "inline-block";
            this.dragOK = true;
        }

        if (below) {
            if (below.parentElement === this.items || below.parentElement.parentElement === this.items) {
                if (below.parentElement.parentElement === this.items) below = below.parentElement;
                if (Utils.getElementIndex(soundList.dragDummy) > Utils.getElementIndex(below)) {
                    soundList.items.insertBefore(soundList.dragDummy, below);
                } else {
                    soundList.items.insertBefore(soundList.dragDummy, below.nextElementSibling);
                }
            }
            if (below.parentElement.id == "soundboardlist") {
                let soundboard = below.soundboard;
                if (!soundboard.linkedFolder) {
                    this.dispatchEvent(new CustomEvent("soundboardselect", { detail: { soundboard } }));
                }
            }
        }
    }

    endFileDrag(e) {
        this.dragging = false;
        this.dragOK = false;
        this.dragDummy.style.display = null;

        if (!e) { // Ends without adding sound(s)
            console.log("File(s) dragging cancelled");
            return;
        }

        // Is there any compatible sound file?
        let paths = [];
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
            const item = e.dataTransfer.files[i];
            if (this._isFileTypeCompatible(item.type)) {
                paths.push(item.path);
            }
        }

        console.log(paths);

        if (paths.length < 1) return;

        if (this.blockAdd) {
            Modal.DefaultModal.linkedSoundboard(MS.getSelectedSoundboard().linkedFolder).open();
            return;
        }

        const index = Utils.getElementIndex(this.dragDummy);
        const sb = MS.getSelectedSoundboard();

        if (paths.length == 1) {
            const soundModal = new SoundModal(SoundModal.Mode.ADD, null, e.dataTransfer.files[0].path);
            soundModal.open();
            soundModal.addEventListener("add", (e) => {
                const sound = e.detail.sound;
                sound.soundboard = sb;
                KeybindManager.registerSound(sound);
                sb.addSound(sound, index);
                this.addSound(sound, index);
                MS.data.save();
            });
        } else {
            const soundsModal = new MultiSoundModal(paths);
            soundsModal.open();
            soundsModal.addEventListener("add", (e) => {
                const sounds = e.detail.sounds;
                for (let i = 0; i < sounds.length; i++) {
                    const sound = sounds[i];
                    sound.soundboard = sb;
                    KeybindManager.registerSound(sound);
                    sb.addSound(sound, index + i);
                    this.addSound(sound, index + i);
                }
                MS.data.save();
            });
        }
    }

    _isFileTypeCompatible(type) {
        return type === "audio/mpeg" || type === "audio/ogg" || type === "audio/wav";
    }

    _filterSounds(sounds) {
        if (!sounds.length) {
            this._displayNoSoundsMessage(NO_SOUNDS);
            return;
        }
        this._removeAll();
        this.infoSpan.style.display = "none";
        let hasSounds = false;
        sounds.forEach(sound => {
            if (!this.filter || sound.name.toLowerCase().includes(this.filter.toLowerCase())) {
                if (!this.dragOK || (!this.dragElem || sound != this.dragElem.sound)) {
                    this.addSound(sound);
                    hasSounds = true;
                }
            }
        });
        this._updatePlayingStates();
        if (!hasSounds && !this.dragOK) this._displayNoSoundsMessage(SEARCH_EMPTY);
    }

    clear() {
        if (!this.dragOK) this._displayNoSoundsMessage(NO_SOUNDS);
        this._removeAll();
    }

    _removeAll() {
        let count = this.items.children.length;
        for (let i = count - 1; i >= 0; i--) {
            let elem = this.items.children.item(i);
            if (!elem.classList.contains("dragdummy") && !elem.classList.contains("drag")) elem.remove();
        }
    }

    _displayNoSoundsMessage(message) {
        if (!message) this.infoSpan.style.display = "none";
        this.infoSpan.style.display = null; // Default display
        this.infoSpan.innerHTML = message;
    }

    /** Returns an element from the list for a specified sound. Returns null if the element is not found. */
    private getSoundElement(sound: Sound): HTMLElement | null {
        if (!this.containerElement) return null;
        for (let i = 0; i < this.containerElement.childElementCount; i++) {
            const node = this.containerElement.childNodes[i];
            if (node.sound === sound) return elem;
        }
        return null;
    }

    /**
     * Sets the element style to represent if it's sound is playing or not.
     * @param {HTMLElement} element
     */
    _setElementPlayingState(element, playingState) {
        if (!element || element.classList.contains("dragdummy")) return;
        if (playingState) {
            element.childNodes[2].style.top = "-11px";
            element.childNodes[2].style.right = "-11px";
        } else {
            element.childNodes[2].style.top = null;
            element.childNodes[2].style.right = null;
        }
    }

    /**
     * Updates the displayed playing states on the list elements based on currently playing sounds.
     */
    _updatePlayingStates() {
        const playing = MS.playingSounds;
        for (let i = 0; i < playing.length; i++) {
            const elem = this._getSoundElement(playing[i]);
            if (elem) this._setElementPlayingState(elem, true);
        }
    }

    _onMouseMove(e) {
        const d = this.dragElem;
        if (!d) return;
        if ((Math.abs(d.initialX - e.clientX) > DRAG_START_OFFSET || Math.abs(d.initialY - e.clientY) > DRAG_START_OFFSET || this.dragOK) && this.dragging) {
            if (!this.dragOK) {
                d.style.width = d.offsetWidth + "px";

                d.style.position = "fixed";
                d.style.pointerEvents = "none";

                d.style.top = e.clientY - d.offsetY + "px";
                d.style.left = e.clientX - d.offsetX + "px";

                d.style.zIndex = 1;

                this.items.insertBefore(this.dragDummy, d.nextSibling);
                this.dragDummy.style.display = "inline-block";
                this.dragOK = true;
            }

            d.classList.add("drag");
            d.style.top = e.clientY - d.offsetY + "px";
            d.style.left = e.clientX - d.offsetX + "px";
            let curr = document.elementFromPoint(e.clientX, e.clientY);
            if (curr) {
                if (curr.parentElement === this.items || curr.parentElement.parentElement === this.items) {
                    if (curr.parentElement.parentElement === this.items) curr = curr.parentElement;
                    if (Utils.getElementIndex(soundList.dragDummy) > Utils.getElementIndex(curr)) {
                        soundList.items.insertBefore(soundList.dragDummy, curr);
                    } else {
                        soundList.items.insertBefore(soundList.dragDummy, curr.nextElementSibling);
                    }
                }
                if (curr.parentElement.id == "soundboardlist" && !this.blockAdd) {
                    let soundboard = curr.soundboard;
                    if (!soundboard.linkedFolder) this.dispatchEvent(new CustomEvent("soundboardselect", { detail: { soundboard } }));
                }
            }
        }
    }

    _onMouseUp(e) {
        this.dragging = false;
        const d = this.dragElem;
        if (!d) return;
        if (d != null && this.dragOK) {
            d.style.position = null;
            this.items.insertBefore(d, this.dragDummy.nextElementSibling);
            void d.offsetWidth; // Trigger Reflow
            d.classList.remove("drag");
            d.style.pointerEvents = null;
            d.style.width = null;
            d.style.top = null;
            d.style.left = null;
            d.style.zIndex = null;
            this.dragElem = null;
            this.dragDummy.style.display = "none";
            this.dragOK = false;
            const newIndex = Utils.getElementIndex(d) - 1;
            if (this.initialIndex != newIndex || this.initialSoundboard != MS.getSelectedSoundboard()) {
                this._reorderSound(this.initialIndex, newIndex);
            }
        }
    }

    _reorderSound(oldIndex, newIndex) {
        const initSBSounds = this.initialSoundboard.sounds;
        const currSBSounds = MS.getSelectedSoundboard().sounds;
        const sound = initSBSounds[oldIndex];

        initSBSounds.splice(oldIndex, 1);
        currSBSounds.splice(newIndex, 0, sound);

        // Register keybind again if it's a different soundboard
        if (this.initialSoundboard != MS.getSelectedSoundboard().sounds) {
            sound.soundboard = MS.getSelectedSoundboard();
            KeybindManager.registerSound(sound);
        }

        MS.data.save();

        this.dispatchEvent(new CustomEvent("reorder", {
            detail: {
                sound,
                oldIndex,
                newIndex,
                oldSoundboard: this.initialSoundboard,
                newSoundboard: MS.getSelectedSoundboard()
            }
        }));
    }
}
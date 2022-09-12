import { KeybindManager, MS, Sound, Soundboard, Utils } from "../../shared/models";
import { DefaultModals, MultiSoundModal, SoundModal } from "../modals";
import { SoundItem } from "../elements";

const NO_SOUNDS = "This soundboard has no sounds";
const SEARCH_EMPTY = "No sounds with the current filter";
const DRAG_START_OFFSET = 10;

type DragStateInfo = {
    offsetX: number,
    offsetY: number,
    initialX: number,
    initialY: number,
    initialSoundIndex: number,
    initialSoundboard: Soundboard,
}

export default class SoundList extends HTMLElement {
    sounds: Sound[] = [];

    private dragElement: SoundItem | null = null;
    private infoElement!: HTMLSpanElement;
    private containerElement!: HTMLDivElement;
    private dragDummyElement!: HTMLDivElement;
    private dragStateInfo: DragStateInfo | null = null;
    private canDrag = false;
    private isDragging = false;

    public canAdd = true;

    private _filter = "";
    get filter(): string {
        return this._filter;
    }
    set filter(text: string) {
        this._filter = text;
        this.filterSounds(this.sounds);
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

        document.addEventListener("mousemove", (e) => this.onMouseMove(e));
        document.addEventListener("mouseup", () => this.onMouseUp());

        this.onmousedown = (e): boolean => {
            if (e.button === 1) return false;
            return true;
        };

        MS.instance.onPlaySound.addHandler(sound => {
            const elem = this.getSoundElement(sound);
            elem?.setPlayingState(true);
        });

        MS.instance.onStopSound.addHandler(sound => {
            const elem = this.getSoundElement(sound);
            elem?.setPlayingState(false);
        });

        MS.instance.onStopAllSounds.addHandler(() => {
            for (let i = 0; i < this.containerElement.childElementCount; i++) {
                const elem = this.containerElement.childNodes[i];
                if (elem instanceof SoundItem) elem.setPlayingState(false);
            }
        });
    }

    addSound(sound: Sound, index: number | null = null): void {
        const item = new SoundItem(sound);

        item.addEventListener("contextmenu", () => {
            const modal = new SoundModal(sound);
            modal.open(this); // TODO: Use Modal Manager.

            modal.addEventListener("edit", () => {
                item.update();
                void KeybindManager.instance.registerSound(sound);
                void MS.instance.data.save();
            });

            modal.addEventListener("remove", () => {
                item.remove();
                MS.instance.stopSound(sound);
                if (!this.hasSounds()) this.displayNoSoundsMessage(NO_SOUNDS);
                // TODO: Do in main process.
                void KeybindManager.instance.unregisterSound(sound);
                MS.instance.getSelectedSoundboard().removeSound(sound);
                void MS.instance.data.save();
            });
        });

        item.addEventListener("mousedown", (e) => {
            if (e.button != 0) return;
            this.dragElement = item;

            let offsetY = e.offsetY;
            let offsetX = e.offsetX;
            if (e.target instanceof HTMLElement && !e.target.classList.contains("item")) {
                offsetY = e.offsetY + e.target.offsetTop;
                offsetX = e.offsetX + e.target.offsetLeft;
            }

            const currentSB = MS.instance.getSelectedSoundboard();

            // TODO: Remake reorder logic. Soundboard.sounds should not be accessed this way.
            this.dragStateInfo = {
                offsetX: offsetX + parseInt(getComputedStyle(item).marginLeft),
                offsetY: offsetY + parseInt(getComputedStyle(item).marginTop),
                initialX: e.clientX,
                initialY: e.clientY,
                initialSoundIndex: currentSB.sounds.indexOf(sound),
                initialSoundboard: currentSB,
            };
        });

        if (!index) {
            this.containerElement.append(item);
        }
        else {
            this.containerElement.insertBefore(item, this.containerElement.childNodes[index]);
        }
    }

    removeSound(sound: Sound): void {
        for (let i = 0; i < this.containerElement.childElementCount; i++) {
            const item = this.containerElement.children[i];
            if (item instanceof SoundItem && item.sound === sound) {
                item.remove();
                if (!this.hasSounds()) this.displayNoSoundsMessage(NO_SOUNDS);
                return;
            }
        }
    }

    setSounds(sounds: Sound[]): void {
        this.sounds = sounds;
        if (sounds.length < 1) {
            this.clear();
            return;
        } else {
            this.filterSounds(sounds);
        }
    }

    hasSounds(): boolean {
        return this.containerElement.childElementCount > 1; // Drag dummy doesn't count
    }

    handleFileDrag(e: DragEvent): void {
        if (!e.dataTransfer || e.dataTransfer.items.length < 1) return;

        // Is there any compatible sound file?
        let valid = false;
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
            const item = e.dataTransfer.items[i];
            if (SoundList.isFileTypeCompatible(item.type)) {
                valid = true;
                break;
            }
        }

        if (!valid) return;

        this.isDragging = true;
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);

        if (!this.canDrag && this.canAdd) {
            this.dragDummyElement.style.display = "inline-block";
            this.canDrag = true;
        }

        if (!targetElement) return;
        if (!(targetElement instanceof SoundItem)) return;

        if (Utils.getElementIndex(this.dragDummyElement) > Utils.getElementIndex(targetElement)) {
            this.containerElement.insertBefore(this.dragDummyElement, targetElement);
        } else {
            this.containerElement.insertBefore(this.dragDummyElement, targetElement.nextElementSibling);
        }

        // TODO: Soundboard list should handle this.
        // if (targetElement.parentElement?.id == "soundboardlist") {
        //     let soundboard = targetElement.soundboard;
        //     if (!soundboard.linkedFolder) {
        //         this.dispatchEvent(new CustomEvent("soundboardselect", { detail: { soundboard } }));
        //     }
        // }
    }

    endFileDrag(e: DragEvent): void {
        this.isDragging = false;
        this.canDrag = false;
        this.dragDummyElement.style.display = "";

        if (!e.dataTransfer) { // Ends without adding sound(s)
            console.log("File(s) dragging cancelled");
            return;
        }

        // Is there any compatible sound file?
        const paths = [];
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
            const item = e.dataTransfer.files[i];
            if (SoundList.isFileTypeCompatible(item.type)) {
                paths.push(item.path);
            }
        }

        console.log(paths);

        if (paths.length < 1) return;

        const currentSoundboard = MS.instance.getSelectedSoundboard();
        if (currentSoundboard.linkedFolder) {
            DefaultModals.linkedSoundboard(currentSoundboard.linkedFolder).open(this); // TODO: Use Modal Manager
            return;
        }

        const index = Utils.getElementIndex(this.dragDummyElement);

        if (paths.length == 1) {
            const soundPath = e.dataTransfer.files[0].path;
            const name = Utils.getNameFromFile(soundPath);
            const newSound = new Sound(name, soundPath, 100, []);
            newSound.connectToSoundboard(currentSoundboard);
            const soundModal = new SoundModal(newSound);
            soundModal.open(this); // TODO: Use Modal Manager.
            soundModal.onSave.addHandler((sound) => { // TODO: Handle elsewhere.
                void KeybindManager.instance.registerSound(sound);
                currentSoundboard.addSound(sound, index);
                this.addSound(sound, index);
                void MS.instance.data.save();
            });

        } else {
            const soundsModal = new MultiSoundModal(paths);
            soundsModal.open(this); // TODO: Use Modal Manager.
            soundsModal.onAdded.addHandler((sounds) => { // TODO: Handle elsewhere.
                for (let i = 0; i < sounds.length; i++) {
                    const sound = sounds[i];
                    sound.connectToSoundboard(currentSoundboard);
                    void KeybindManager.instance.registerSound(sound);
                    currentSoundboard.addSound(sound, index + i);
                    this.addSound(sound, index + i);
                }
                void MS.instance.data.save();
            });
        }
    }

    // TODO: Move this.
    private static isFileTypeCompatible(type: string): boolean {
        return type === "audio/mpeg" || type === "audio/ogg" || type === "audio/wav";
    }

    private filterSounds(sounds: Sound[]): void {
        if (!sounds.length) {
            this.displayNoSoundsMessage(NO_SOUNDS);
            return;
        }
        this.removeAll();
        this.infoElement.style.display = "none";
        let hasSounds = false;
        for (const sound of sounds) {
            if (!this.filter || sound.name.toLowerCase().includes(this.filter.toLowerCase())) {
                if (!this.canDrag || (!this.dragElement || sound != this.dragElement.sound)) {
                    this.addSound(sound);
                    hasSounds = true;
                }
            }
        }

        this.updatePlayingStates();
        if (!hasSounds && !this.canDrag) this.displayNoSoundsMessage(SEARCH_EMPTY);
    }

    clear(): void {
        if (!this.canDrag) this.displayNoSoundsMessage(NO_SOUNDS);
        this.removeAll();
    }

    private removeAll(): void {
        const count = this.containerElement.children.length;
        for (let i = count - 1; i >= 0; i--) {
            const elem = this.containerElement.children.item(i);
            if (elem instanceof SoundItem) elem.remove();
        }
    }

    private displayNoSoundsMessage(message: string): void {
        if (!message) this.infoElement.style.display = "none";
        this.infoElement.style.display = ""; // Default display
        this.infoElement.innerHTML = message;
    }

    /** Returns an element from the list for a specified sound. Returns null if the element is not found. */
    private getSoundElement(sound: Sound): SoundItem | null {
        for (let i = 0; i < this.containerElement.childElementCount; i++) {
            const node = this.containerElement.childNodes[i];
            if (node instanceof SoundItem && node.sound.equals(sound)) return node;
        }
        return null;
    }

    /** Updates the displayed playing states on the list elements based on currently playing sounds. */
    private updatePlayingStates(): void {
        const playing = MS.instance.playingSounds;
        for (let i = 0; i < playing.length; i++) {
            const elem = this.getSoundElement(playing[i]);
            if (elem) elem.setPlayingState(true);
        }
    }

    private onMouseMove(e: MouseEvent): void {
        const d = this.dragElement;
        const i = this.dragStateInfo;
        if (!d || !i) return;
        if ((Math.abs(i.initialX - e.clientX) > DRAG_START_OFFSET || Math.abs(i.initialY - e.clientY) > DRAG_START_OFFSET || this.canDrag) && this.isDragging) {
            if (!this.canDrag) {
                d.style.width = `${d.offsetWidth}px`;

                d.style.position = "fixed";
                d.style.pointerEvents = "none";

                d.style.top = `${e.clientY - i.offsetY}px`;
                d.style.left = `${e.clientX - i.offsetX}px`;

                d.style.zIndex = "1";

                this.containerElement.insertBefore(this.dragDummyElement, d.nextSibling);
                this.dragDummyElement.style.display = "inline-block";
                this.canDrag = true;
            }

            d.classList.add("drag");
            d.style.top = `${e.clientY - i.offsetY}px`;
            d.style.left = `${e.clientX - i.offsetX}px`;
            const curr = document.elementFromPoint(e.clientX, e.clientY);
            if (curr && curr instanceof SoundItem) {
                if (Utils.getElementIndex(this.dragDummyElement) > Utils.getElementIndex(curr)) {
                    this.containerElement.insertBefore(this.dragDummyElement, curr);
                } else {
                    this.containerElement.insertBefore(this.dragDummyElement, curr.nextElementSibling);
                }

                // TODO: Soundboard list should handle this.
                // if (curr.parentElement.id == "soundboardlist" && !this.blockAdd) {
                //     let soundboard = curr.soundboard;
                //     if (!soundboard.linkedFolder) this.dispatchEvent(new CustomEvent("soundboardselect", { detail: { soundboard } }));
                // }
            }
        }
    }

    private onMouseUp(): void {
        this.isDragging = false;
        const d = this.dragElement;
        const i = this.dragStateInfo;
        if (!i || !d || !this.canDrag) return;

        d.style.position = "";
        this.containerElement.insertBefore(d, this.dragDummyElement.nextElementSibling);
        void d.offsetWidth; // Triggers Reflow
        d.classList.remove("drag");
        d.style.pointerEvents = "";
        d.style.width = "";
        d.style.top = "";
        d.style.left = "";
        d.style.zIndex = "";
        this.dragElement = null;
        this.dragDummyElement.style.display = "none";
        this.canDrag = false;
        const newIndex = Utils.getElementIndex(d) - 1;
        if (i.initialSoundIndex != newIndex || !i.initialSoundboard.equals(MS.instance.getSelectedSoundboard())) {
            SoundList.reorderSound(i.initialSoundIndex, newIndex, i);
        }
    }

    // TODO: Remake and move to main process. Raise event here.
    private static reorderSound(oldIndex: number, newIndex: number, dragInfo: DragStateInfo): void {
        const currSB = MS.instance.getSelectedSoundboard();
        const initSBSounds = dragInfo.initialSoundboard.sounds;
        const currSBSounds = currSB.sounds;
        const sound = initSBSounds[oldIndex];

        initSBSounds.splice(oldIndex, 1);
        currSBSounds.splice(newIndex, 0, sound);

        // Register keybind again if it's a different soundboard
        if (!dragInfo.initialSoundboard.equals(currSB)) {
            sound.connectToSoundboard(currSB);
            void KeybindManager.instance.registerSound(sound);
        }

        void MS.instance.data.save();

        // this.dispatchEvent(new CustomEvent("reorder", {
        //     detail: {
        //         sound,
        //         oldIndex,
        //         newIndex,
        //         oldSoundboard: this.initialSoundboard,
        //         newSoundboard: MS.getSelectedSoundboard()
        //     }
        // }));
    }
}
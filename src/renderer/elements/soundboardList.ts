import { SoundboardItem } from "../elements";
import { Soundboard } from "../../shared/models";
import { Event, ExposedEvent } from "../../shared/events";
import MSR from "../msr";
import Utils from "../util/utils";

const DRAG_START_OFFSET = 10;

interface DragInfo {
    element: SoundboardItem;
    offsetY: number;
    initialY: number;
}

export default class SoundboardList extends HTMLElement {
    private currentDragInfo: DragInfo | null = null;
    private dragDummy!: HTMLDivElement;
    private isMouseDown = false;
    private canDrag = false;

    private readonly _onSelectSoundboard = new Event<Soundboard>();
    get onSelectSoundboard(): ExposedEvent<Soundboard> { return this._onSelectSoundboard.expose(); }

    private *getItems(): Generator<SoundboardItem> {
        for (let i = 0; i < this.childElementCount; i++) {
            const element = this.childNodes[i];
            if (element instanceof SoundboardItem) {
                yield element;
            }
        }
    }

    protected connectedCallback(): void {
        // Add drag dummy item
        const item = document.createElement("div");
        item.classList.add("item", "dragdummy");
        this.dragDummy = item;
        this.appendChild(item);

        MSR.instance.audioManager.onPlaySound.addHandler(s => {
            if (!s.connectedSoundboard) return;
            const elem = this.getSoundboardElement(s.connectedSoundboard);
            elem?.updatePlayingIndicator(1);
        });

        MSR.instance.audioManager.onStopSound.addHandler(s => {
            if (!s.connectedSoundboard) return;
            const elem = this.getSoundboardElement(s.connectedSoundboard);
            elem?.updatePlayingIndicator(-1);
        });

        MSR.instance.audioManager.onStopAllSounds.addHandler(() => this.setAllPlayingIndicators(false));

        this.onmousedown = (e): boolean => {
            if (e.button === 1) return false;
            return true;
        };

        document.addEventListener("mousemove", (e) => this.mouseMove(e));
        document.addEventListener("mouseup", () => this.mouseUp());
    }

    addSoundboard(soundboard: Soundboard): void {
        const sbElement = new SoundboardItem(soundboard);
        sbElement.addEventListener("mousedown", (e) => this.itemMouseDown(e, sbElement));

        // TODO: Business logic should not be handled here.

        sbElement.addEventListener("click", () => {
            if (!sbElement.isSelected) {
                this.select(sbElement.soundboard);
            }
        });

        sbElement.addEventListener("auxclick", (e) => {
            if (e.button === 1) {
                // TODO: Raise event
                // MSR.instance.audioManager.stopSounds(sbElement.soundboard);
            }
        });

        sbElement.addEventListener("contextmenu", () => {
            // TODO: Raise event
            // const editModal = new SoundboardModal(SoundboardModal.Mode.EDIT, item.soundboard, MS.data.soundboards.length < 2);
            // editModal.open();
            // editModal.addEventListener("edit", (e) => {
            //     item.soundboard = e.detail.soundboard;
            //     KeybindManager.registerSoundboardn(item.soundboard);
            //     this.updateElements(item);
            //     item.soundboard.removeFolderListener();
            //     if (item.soundboard.linkedFolder) {
            //         item.soundboard.updateFolderSounds();
            //         item.soundboard.setupFolderListener();
            //         if (MS.getSelectedSoundboard() === item.soundboard) this.select(item);
            //     }
            //     MS.data.save();
            // });

            // editModal.addEventListener("remove", (e) => {
            //     item.remove();
            //     MS.data.removeSoundboard(e.detail.soundboard);
            //     if (!MS.getSelectedSoundboard()) {
            //         MS.setSelectedSoundboard(0);
            //         this.selectSoundboardAt(0);
            //     } else {
            //         this.selectSoundboardAt(MS.settings.selectedSoundboard);
            //     }
            //     MS.data.save();
            // });
        });

        this.appendChild(sbElement);
    }

    select(soundboard: Soundboard): void {
        let selected = false;
        for (const item of this.getItems()) {
            item.isSelected = item.soundboard.equals(soundboard);
            selected = true;
        }
        if (selected)
            this._onSelectSoundboard.raise(soundboard);
        else {
            this.selectSoundboardAt(0);
        }
    }

    selectSoundboardAt(index: number): void {
        const res = Array.from(this.getItems());
        this.select(res[index].soundboard);
    }

    /** Updates the information about playing sounds in a soundboard. */
    incrementPlayingSound(soundboard: Soundboard, increment: number): void {
        const elem = this.getSoundboardElement(soundboard);
        if (!elem) return;
        elem.updatePlayingIndicator(increment);
    }

    /** Returns the element from the list representing a specific soundboard. Returns null if no element is found. */
    private getSoundboardElement(soundboard: Soundboard): SoundboardItem | null {
        for (const item of this.getItems()) {
            if (item.soundboard.equals(soundboard)) return item;
        }
        return null;
    }

    /** Sets all playing indicators to a specific state. */
    private setAllPlayingIndicators(state: boolean): void {
        for (const item of this.getItems()) {
            item.setPlayingIndicatorState(state);
        }
    }

    //#region Drag Functions

    private itemMouseDown(e: MouseEvent, item: SoundboardItem): void {
        if (e.button != 0) return;

        let offsetY = e.offsetY;
        if (e.target instanceof HTMLElement && !e.target.classList.contains("item")) {
            offsetY = e.offsetY + e.target.offsetTop;
        }

        offsetY = offsetY + parseInt(getComputedStyle(item).marginTop);

        this.currentDragInfo = { element: item, offsetY: offsetY, initialY: e.clientY };
        this.isMouseDown = true;
    }

    private mouseMove(e: MouseEvent): void {
        const d = this.currentDragInfo;
        if (!d) return;
        if ((Math.abs(d.initialY - e.clientY) > DRAG_START_OFFSET || this.canDrag) && this.isMouseDown) {
            if (!this.canDrag) {
                d.element.style.width = `${d.element.offsetWidth}px`;

                d.element.style.position = "fixed";
                d.element.style.pointerEvents = "none";

                d.element.style.top = `${e.clientY - d.offsetY}px`;
                d.element.style.zIndex = "1";

                this.insertBefore(this.dragDummy, d.element.nextSibling);
                this.dragDummy.style.display = "inline-block";
                this.canDrag = true;
            }

            d.element.classList.add("drag");
            d.element.style.top = `${e.clientY - d.offsetY}px`;
            let curr = document.elementFromPoint(d.element.getBoundingClientRect().x, e.clientY);
            if (curr) {
                if (curr.parentElement === this || curr.parentElement?.parentElement === this) {
                    if (curr.parentElement.parentElement === this) curr = curr.parentElement;
                    if (Utils.getElementIndex(this.dragDummy) > Utils.getElementIndex(curr)) {
                        this.insertBefore(this.dragDummy, curr);
                    } else {
                        this.insertBefore(this.dragDummy, curr.nextElementSibling);
                    }
                }
            }
        }
    }

    private mouseUp(): void {
        this.isMouseDown = false;
        const d = this.currentDragInfo;
        if (!d) return;
        if (this.canDrag) {
            d.element.style.position = "";
            this.insertBefore(d.element, this.dragDummy.nextElementSibling);
            void d.element.offsetWidth; // Trigger Reflow
            d.element.classList.remove("drag");
            d.element.style.pointerEvents = "";
            d.element.style.width = "";
            d.element.style.top = "";
            d.element.style.zIndex = "";
            this.currentDragInfo = null;
            this.dragDummy.style.display = "none";
            this.canDrag = false;
            const currIndex = Utils.getElementIndex(d.element);
            const newIndex = Utils.getElementIndex(this.dragDummy) - 1;
            if (currIndex != newIndex) {
                // TODO: Call Reorder
                // void SoundboardList.reorder(this.startDragIndex, newIndex);
            }
        }
    }

    // TODO: This shouldn't be here.
    // private static async reorder(oldIndex: number, newIndex: number): Promise<void> {
    //     const sb = MS.instance.data.soundboards[oldIndex];
    //     const selectedSB = MS.instance.getSelectedSoundboard();

    //     MS.instance.data.soundboards.splice(oldIndex, 1);
    //     MS.instance.data.soundboards.splice(newIndex, 0, sb);

    //     MS.instance.setSelectedSoundboard(selectedSB);
    //     await MS.instance.data.save();
    //     await MS.instance.settings.save();
    // }

    //#endregion
}
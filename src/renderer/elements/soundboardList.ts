import { SoundboardItem, SoundItem } from "../elements";
import { Soundboard } from "../../shared/models";
import Utils from "../util/utils";
import Draggable from "./draggable";

export default class SoundboardList extends HTMLElement {
    private selectedItem?: SoundboardItem;
    private dragElement: SoundboardItem | null = null;
    private dragDummy!: HTMLDivElement;

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

        window.events.onCurrentSoundboardChanged.addHandler(sb => {
            this.updateSeleced(sb);
        });

        window.events.onSoundboardRemoved.addHandler(sb => {
            const elem = this.getSoundboardElement(sb);
            elem?.remove();
        });

        window.events.onSoundboardAdded.addHandler(args => {
            this.addSoundboard(args.soundboard, args.index);
        });

        // this.addEventListener("dragover", this.handleDragOver);

        document.addEventListener("mousemove", e => {
            if (Draggable.currentElement) {
                if (Draggable.currentElement instanceof SoundboardItem) {
                    if (!this.dragElement) {
                        this.showDragDummy();
                        this.dragElement = Draggable.currentElement;
                        this.handleDragOver(e.clientY);
                    } else {
                        this.handleDragOver(e.clientY);
                    }
                }
                else if (Draggable.currentElement instanceof SoundItem) {
                    const target = this.getItemAtPosition(e.clientY, e.clientX);
                    if (target && !target.isSelected) target.select();
                }
            }
        });
    }

    getSelectedSoundboard(): Soundboard | null {
        if (this.selectedItem)
            return this.selectedItem.soundboard;
        return null;
    }

    addSoundboard(soundboard: Soundboard, index?: number): void {
        const sbElement = new SoundboardItem(soundboard);

        sbElement.onDragEnd.addHandler(() => {
            this.handleDrop();
            this.dragElement = null;
        });

        let beforeElement: HTMLElement | undefined = undefined;
        if (index !== undefined) {
            const items = Array.from(this.getItems());
            if (index >= 0 && index < items.length) beforeElement = items[index];
        }

        if (beforeElement) this.insertBefore(sbElement, beforeElement);
        else this.appendChild(sbElement);
    }

    /** Updates the information about playing sounds in a soundboard. */
    incrementPlayingSound(soundboard: Soundboard, increment: number): void {
        const elem = this.getSoundboardElement(soundboard);
        if (!elem) return;
        elem.updatePlayingIndicator(increment);
    }

    private updateSeleced(soundboard: Soundboard): void {
        this.unselectAll();
        for (const item of this.getItems()) {
            if (Soundboard.equals(item.soundboard, soundboard)) {
                item.isSelected = true;
                this.selectedItem = item;
            }
        }
    }

    private unselectAll(): void {
        for (const item of this.getItems()) {
            item.isSelected = false;
        }
    }

    private hideDragDummy(): void {
        this.dragDummy.style.display = "";
    }

    private showDragDummy(): void {
        this.dragDummy.style.display = "inline-block";
    }

    /** Returns the element from the list representing a specific soundboard. Returns null if no element is found. */
    private getSoundboardElement(soundboard: Soundboard): SoundboardItem | null {
        for (const item of this.getItems()) {
            if (Soundboard.equals(item.soundboard, soundboard)) return item;
        }
        return null;
    }

    private getItemAtPosition(y: number, x?: number): SoundboardItem | undefined {
        const target = document.elementFromPoint(x ?? this.getBoundingClientRect().x, y);

        if (!target) return undefined;
        if (!(target instanceof SoundboardItem)) return undefined;

        return target;
    }

    private getItemIndex(item: SoundboardItem): number {
        let i = 0;
        for (const curr of this.getItems()) {
            if (curr === item) return i;
            i++;
        }
        return i;
    }

    // Handlers

    private handleDragOver = (yPos: number): void => {
        const target = this.getItemAtPosition(yPos);
        if (!target) return;

        if (this.dragElement) {
            if (Utils.getElementIndex(this.dragDummy) > Utils.getElementIndex(target)) {
                this.insertBefore(this.dragDummy, target);
            } else {
                this.insertBefore(this.dragDummy, target.nextElementSibling);
            }
        } else {
            const curr = this.getSelectedSoundboard();
            if (!curr || !Soundboard.equals(target.soundboard, curr))
                window.actions.setCurrentSoundboard(target.soundboard.uuid);
        }
    };

    private handleDrop = (): void => {
        if (!this.dragElement) return;

        this.insertBefore(this.dragElement, this.dragDummy.nextElementSibling);
        const newIndex = this.getItemIndex(this.dragElement);
        window.actions.moveSoundboard(this.dragElement.soundboard.uuid, newIndex);

        this.hideDragDummy();
    };
}

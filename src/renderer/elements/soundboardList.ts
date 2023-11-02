import { SoundboardItem } from "../elements";
import Utils from "../util/utils";
import Draggable from "./draggable";
import GlobalEvents from "../util/globalEvents";
import { Soundboard, equals } from "../../shared/models/soundboard";

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

        GlobalEvents.addHandler("onCurrentSoundboardChanged", sb => {
            this.selectSoundboard(sb);
        });

        GlobalEvents.addHandler("onSoundboardRemoved", sb => {
            const elem = this.getSoundboardElement(sb.uuid);
            elem?.destroy();
        });

        GlobalEvents.addHandler("onSoundboardAdded", args => {
            this.addSoundboard(args.soundboard, args.index);
        });

        document.addEventListener("mousemove", e => {
            if (Draggable.currentElement instanceof SoundboardItem) {
                const d = Draggable.currentElement;
                if (!this.dragElement) {
                    this.showDragDummy();
                    this.dragElement = d;
                }
                this.handleDragOver(e.clientY);
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

    selectSoundboard(soundboard: Soundboard): void {
        this.unselectAll();
        for (const item of this.getItems()) {
            if (equals(item.soundboard, soundboard)) {
                item.soundboard = soundboard;
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
    private getSoundboardElement(soundboardUuid: string): SoundboardItem | null {
        for (const item of this.getItems()) {
            if (item.soundboard.uuid === soundboardUuid) return item;
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
        if (!target || !this.dragElement) return;

        if (Utils.getElementIndex(this.dragDummy) > Utils.getElementIndex(target)) {
            this.insertBefore(this.dragDummy, target);
        } else {
            this.insertBefore(this.dragDummy, target.nextElementSibling);
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

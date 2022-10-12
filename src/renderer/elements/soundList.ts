import { Sound } from "../../shared/models";
import { SoundItem } from "../elements";
import Utils from "../util/utils";

const NO_SOUNDS = "This soundboard has no sounds";
const SEARCH_EMPTY = "No sounds with the current filter";

export default class SoundList extends HTMLElement {
    private currentSoundboardId?: string;
    private dragElement: SoundItem | null = null;
    private infoElement!: HTMLSpanElement;
    private containerElement!: HTMLDivElement;
    private dragDummyElement!: HTMLDivElement;

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

        window.events.onSoundAdded.addHandler(e => {
            this.addSound(e.sound, e.index);
        });

        window.events.onSoundRemoved.addHandler(s => {
            this.removeSound(s);
        });

        window.events.onCurrentSoundboardChanged.addHandler(sb => {
            this.loadSounds(sb.sounds, sb.uuid);
        });
    }

    loadSounds(sounds: Sound[], soundboardUuid: string): void {
        this.currentSoundboardId = soundboardUuid;
        this.clear();
        for (const sound of sounds) {
            this.addSound(sound);
        }
    }

    startDrag(): void {
        this.addEventListener("mousemove", this.handleMouseMove);
        this.dragDummyElement.style.display = "inline-block";
    }

    /** Returns the index of the element being dragged over the list. */
    stopDrag(): number {
        this.removeEventListener("mousemove", this.handleMouseMove);
        this.dragDummyElement.style.display = "";
        return this.getDragElementIndex();
    }

    filter(filter: string): void {
        this.infoElement.style.display = "none";
        let hasSounds = false;
        for (const soundItem of this.getSoundItems()) {
            let isValid = !filter || soundItem.sound.name.toLowerCase().includes(filter.toLowerCase());
            isValid = isValid && (!this.dragElement || soundItem != this.dragElement); // Is not the current drag element

            if (isValid) hasSounds = true;
            soundItem.style.display = isValid ? "" : "none";
        }
        if (!hasSounds) this.displayEmptyMessage(SEARCH_EMPTY);
    }

    // --- // ---

    private addSound(sound: Sound, index?: number): void {
        const item = new SoundItem(sound);

        item.addEventListener("dragstart", () => {
            this.dragElement = item;
            this.startDrag();
        });

        item.addEventListener("dragend", () => this.handleDrop);

        if (!index) {
            this.containerElement.append(item);
        }
        else {
            this.containerElement.insertBefore(item, this.containerElement.childNodes[index]);
        }
    }

    private removeSound(sound: Sound): void {
        for (const item of this.getSoundItems()) {
            if (item instanceof SoundItem && item.sound.equals(sound)) {
                this.removeSoundItem(item);
                return;
            }
        }
    }

    private clear(): void {
        for (const item of this.getSoundItems()) {
            this.removeSoundItem(item);
        }
    }

    private hasSounds(): boolean {
        return this.containerElement.childElementCount > 1; // Drag dummy doesn't count
    }

    private removeSoundItem(element: SoundItem): void {
        element.remove();
        if (!this.hasSounds()) this.displayEmptyMessage(NO_SOUNDS);
    }

    private getDragElementIndex(): number {
        if (!this.dragElement) return 0;
        return Utils.getElementIndex(this.dragElement) - 1;
    }

    private displayEmptyMessage(message: string): void {
        if (!message) this.infoElement.style.display = "none";
        this.infoElement.style.display = "";
        this.infoElement.innerHTML = message;
    }

    private * getSoundItems(): Generator<SoundItem> {
        for (const element of this.containerElement.children) {
            if (element instanceof SoundItem) yield element;
        }
    }

    // Handlers

    private handleMouseMove = (e: MouseEvent): void => {
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);

        if (!targetElement) return;
        if (!(targetElement instanceof SoundItem)) return;

        if (Utils.getElementIndex(this.dragDummyElement) > Utils.getElementIndex(targetElement)) {
            this.containerElement.insertBefore(this.dragDummyElement, targetElement);
        } else {
            this.containerElement.insertBefore(this.dragDummyElement, targetElement.nextElementSibling);
        }
    };

    private handleDrop = (): void => {
        if (!this.dragElement || !this.currentSoundboardId) return;

        this.containerElement.insertBefore(this.dragElement, this.dragDummyElement.nextElementSibling);
        const newIndex = this.getDragElementIndex();

        window.actions.moveSound(this.dragElement.sound.uuid, this.currentSoundboardId, newIndex);

        this.dragElement = null;
        this.stopDrag();
    };
}

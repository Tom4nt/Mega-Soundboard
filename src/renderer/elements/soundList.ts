import { Sound } from "../../shared/models";
import { SoundItem } from "../elements";
import MSR from "../msr";
import Actions from "../util/actions";
import GlobalEvents from "../util/globalEvents";
import Utils from "../util/utils";
import Draggable from "./draggable";

const NO_SOUNDS = "This soundboard has no sounds";
const SEARCH_EMPTY = "No sounds with the current filter";

export default class SoundList extends HTMLElement {
    private currentFilter = "";
    private currentSoundboardId?: string;
    private dragElement: SoundItem | null = null;
    private infoElement!: HTMLSpanElement;
    private containerElement!: HTMLDivElement;
    private dragDummyElement!: HTMLDivElement;
    private dragDepth = 0;
    private allowImport = true;

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

        GlobalEvents.addHandler("onSoundAdded", e => {
            this.addSound(e.sound, e.index);
        });

        GlobalEvents.addHandler("onSoundRemoved", s => {
            this.removeSound(s);
        });

        GlobalEvents.addHandler("onCurrentSoundboardChanged", sb => {
            this.loadSounds(sb.sounds, sb.uuid, sb.linkedFolder === null);
        });

        GlobalEvents.addHandler("onSoundboardChanged", sb => {
            if (sb.linkedFolder !== null && this.currentSoundboardId == sb.uuid)
                this.loadSounds(sb.sounds, sb.uuid, true);
        });

        document.addEventListener("mousemove", e => {
            if (Draggable.currentElement && Draggable.currentElement instanceof SoundItem) {
                if (!this.dragElement) {
                    this.showDragDummy();
                    this.dragElement = Draggable.currentElement;
                    this.handleDragOver(e);
                } else {
                    this.handleDragOver(e);
                }
            }
        });

        this.addEventListener("dragenter", this.handleDragEnter);
        this.addEventListener("dragover", e => {
            e.preventDefault();
        });
        this.addEventListener("dragleave", this.handleFileDrop);
        this.addEventListener("drop", this.handleFileDrop);
    }

    loadSounds(sounds: Sound[], soundboardUuid: string, allowImport: boolean): void {
        this.allowImport = allowImport;
        this.currentSoundboardId = soundboardUuid;
        this.clear();
        for (const sound of sounds) {
            if (!this.dragElement || !Sound.equals(this.dragElement.sound, sound))
                this.addSound(sound);
        }
        this.filter(this.currentFilter);
    }

    showDragDummy(): void {
        this.dragDummyElement.style.display = "inline-block";
    }

    /** Returns the index of the element being dragged over the list. */
    hideDragDummy(): number {
        this.removeEventListener("mousemove", this.handleDragOver);
        this.dragDummyElement.style.display = "";
        return this.getDragDummyIndex();
    }

    filter(filter: string): void {
        this.currentFilter = filter;
        for (const soundItem of this.getSoundItems()) {
            if (soundItem === this.dragElement) continue;
            let isValid = !filter || soundItem.sound.name.toLowerCase().includes(filter.toLowerCase());
            isValid = isValid && (!this.dragElement || soundItem != this.dragElement); // Is not the current drag element
            soundItem.style.display = isValid ? "" : "none";
        }
        this.updateMessage();
    }

    // --- // ---

    private addSound(sound: Sound, index?: number): void {
        const item = new SoundItem(sound);

        item.onDragEnd.addHandler(() => {
            this.handleItemDrop();
            this.dragElement = null;
        });

        if (index === undefined) {
            this.containerElement.append(item);
        }
        else {
            this.containerElement.insertBefore(item, this.containerElement.childNodes[index]);
        }

        this.updateMessage();
    }

    private removeSound(sound: Sound): void {
        for (const item of this.getSoundItems()) {
            if (item instanceof SoundItem && Sound.equals(item.sound, sound)) {
                this.removeSoundItem(item);
                return;
            }
        }
    }

    private clear(): void {
        for (const item of this.getSoundItems()) {
            if (item !== this.dragElement) this.removeSoundItem(item);
        }
    }

    private hasSounds(): boolean {
        const items = this.getSoundItems();
        return items.filter(x => window.getComputedStyle(x).display !== "none").length > 0;
    }

    private removeSoundItem(element: SoundItem): void {
        element.destroy();
        this.updateMessage();
    }

    private getDragDummyIndex(): number {
        return Utils.getElementIndex(this.dragDummyElement);
    }

    private updateMessage(): void {
        if (!this.hasSounds()) this.displayEmptyMessage(this.currentFilter ? SEARCH_EMPTY : NO_SOUNDS);
        else this.displayEmptyMessage("");
    }

    private displayEmptyMessage(message: string): void {
        if (!message) {
            this.infoElement.style.display = "none";
        } else {
            this.infoElement.style.display = "";
            this.infoElement.innerHTML = message;
        }
    }

    private getSoundItems(): SoundItem[] {
        return Array.from(this.iterateSoundItems());
    }

    private * iterateSoundItems(): Generator<SoundItem> {
        for (const element of this.containerElement.children) {
            if (element instanceof SoundItem) yield element;
        }
    }

    private async onFileDrop(e: DragEvent): Promise<void> {
        this.hideDragDummy();

        if (!e.dataTransfer || e.dataTransfer.items.length < 1) return;

        const paths = Utils.getDataTransferFilePaths(e.dataTransfer);
        const validPaths = await window.actions.getValidSoundPaths(paths);

        if (validPaths.length <= 0) return;

        if (this.currentSoundboardId)
            await Actions.addSounds(validPaths, this.currentSoundboardId, this.getDragDummyIndex());
    }

    // Handlers

    private handleDragOver = (e: MouseEvent): void => {
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);

        if (!targetElement) return;
        if (!(targetElement instanceof SoundItem)) return;

        if (Utils.getElementIndex(this.dragDummyElement) > Utils.getElementIndex(targetElement)) {
            this.containerElement.insertBefore(this.dragDummyElement, targetElement);
        } else {
            this.containerElement.insertBefore(this.dragDummyElement, targetElement.nextElementSibling);
        }
    };

    private handleItemDrop = (): void => {
        if (!this.dragElement || !this.currentSoundboardId) return;

        this.containerElement.insertBefore(this.dragElement, this.dragDummyElement.nextElementSibling);
        const newIndex = this.getDragDummyIndex();

        window.actions.moveSound(this.dragElement.sound.uuid, this.currentSoundboardId, newIndex);

        this.hideDragDummy();
    };

    private handleDragEnter = (e: DragEvent): void => {
        e.preventDefault();
        if (MSR.instance.modalManager.hasOpenModal || !this.allowImport) return;
        this.dragDepth++;
        this.showDragDummy();
        this.handleDragOver(e);
    };

    private handleFileDrop = (e: DragEvent): void => {
        e.preventDefault();
        if (MSR.instance.modalManager.hasOpenModal || !this.allowImport) return;
        this.dragDepth--;
        if (this.dragDepth === 0)
            void this.onFileDrop(e);
    };
}

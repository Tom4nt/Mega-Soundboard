import { Event, ExposedEvent } from "../../shared/events";
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

    private _onSoundDragStart = new Event<Sound>();
    public get onSoundDragStart(): ExposedEvent<Sound> { return this._onSoundDragStart.expose(); }

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
            if (e.sound.soundboardUuid === this.currentSoundboardId)
                this.addSound(e.sound, e.index);
        });

        GlobalEvents.addHandler("onSoundRemoved", s => {
            this.removeSound(s);
        });

        GlobalEvents.addHandler("onCurrentSoundboardChanged", sb => {
            this.loadSounds(sb.sounds, sb.uuid, sb.linkedFolder === null);
        });

        GlobalEvents.addHandler("onSoundboardSoundsSorted", sb => {
            if (this.currentSoundboardId === sb.uuid)
                this.loadSounds(sb.sounds, sb.uuid, true);
        });

        document.addEventListener("mousemove", e => {
            if (Draggable.currentElement && Draggable.currentElement instanceof SoundItem) {
                if (!this.dragElement) {
                    this.showDragDummy();
                    this.dragElement = Draggable.currentElement;
                }
                this.handleDragOver(e);
            }
        });

        this.addEventListener("dragenter", this.handleDragEnter);
        this.addEventListener("dragover", e => {
            e.preventDefault();
        });
        this.addEventListener("dragleave", this.handleFileLeaveOrDrop);
        this.addEventListener("drop", this.handleFileLeaveOrDrop);
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

    hideDragDummy(): void {
        this.removeEventListener("mousemove", this.handleDragOver);
        this.dragDummyElement.style.display = "";
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

        item.onDragStart.addHandler(async e => {
            if (this.currentSoundboardId) {
                const sb = await window.actions.getSoundboard(this.currentSoundboardId);
                await item.updateHint({ name: sb.name, uuid: sb.uuid, isLinked: sb.linkedFolder !== null });
                this._onSoundDragStart.raise(sound);
            } else {
                e.cancel = true;
            }
        });

        item.onDragEnd.addHandler(() => {
            const elem = this.dragElement;
            this.dragElement = null;
            if (elem) this.handleItemDrop(elem);
        });

        if (index === undefined) {
            this.containerElement.append(item);
        }
        else {
            const child = this.containerElement.childNodes[index];
            if (child) this.containerElement.insertBefore(item, child);
            else this.containerElement.append(item);
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

    private getDragDummyIndex(dragElement: SoundItem | null): number {
        return Utils.getElementIndex(this.dragDummyElement, (e) => e != dragElement);
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
            await Actions.addSounds(validPaths, this.currentSoundboardId, this.getDragDummyIndex(null));
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

    private handleItemDrop = (dragElement: SoundItem): void => {
        if (!this.currentSoundboardId) return;
        const newIndex = this.getDragDummyIndex(dragElement);
        this.hideDragDummy();

        // This will reload the list since it is listening to the onSoundboardChanged global event.
        const destinationUUID = dragElement.draggingToNewSoundboard ? null : this.currentSoundboardId;
        if (dragElement.dragMode === "copy") {
            void window.actions.copySound(dragElement.sound.uuid, destinationUUID, newIndex);
        } else {
            void window.actions.moveSound(dragElement.sound.uuid, destinationUUID, newIndex);
        }
    };

    private handleDragEnter = (e: DragEvent): void => {
        e.preventDefault();
        if (MSR.instance.modalManager.hasOpenModal || !this.allowImport) return;
        this.dragDepth++;
        this.showDragDummy();
        this.handleDragOver(e);
    };

    private handleFileLeaveOrDrop = (e: DragEvent): void => {
        e.preventDefault();
        if (MSR.instance.modalManager.hasOpenModal || !this.allowImport) return;
        this.dragDepth--;
        if (this.dragDepth === 0)
            void this.onFileDrop(e);
    };
}

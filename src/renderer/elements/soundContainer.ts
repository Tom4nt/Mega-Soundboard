import { Event, ExposedEvent } from "../../shared/events";
import { Sound } from "../../shared/models";
import { Draggable, FileDropArea, SoundItem } from "../elements";
import Utils from "../util/utils";

export interface SoundDroppedEventArgs {
    item: SoundItem,
    index: number,
}

export interface FileDroppedEventArgs {
    event: DragEvent,
    index: number,
}

export default class SoundContainer extends HTMLElement {
    private _loadedSounds: SoundItem[] = [];
    private _dragElement: SoundItem | null = null;
    private _dragDummyDiv!: HTMLDivElement;
    private _containerDiv!: HTMLDivElement;
    private _emptyMsgSpan!: HTMLSpanElement;
    private _currSubContainer: SoundContainer | null = null;

    public allowFileImport = true;

    private _filter = "";
    public get filter(): string { return this._filter; }
    public set filter(v: string) {
        this._filter = v;
        this.filterSounds(v);
    }

    private _onSoundDragStart = new Event<Sound>();
    public get onSoundDragStart(): ExposedEvent<Sound> { return this._onSoundDragStart.expose(); }

    private _onFileDropped = new Event<FileDroppedEventArgs>();
    public get onFileDropped(): ExposedEvent<FileDroppedEventArgs> { return this._onFileDropped.expose(); }

    private _onSoundDropped = new Event<SoundDroppedEventArgs>();
    public get onSoundDropped(): ExposedEvent<SoundDroppedEventArgs> { return this._onSoundDropped.expose(); }

    public constructor(
        public readonly emptyMessageRequested: () => string,
        public readonly parentSoundId?: string,
    ) {
        super();
    }

    protected connectedCallback(): void {
        const dropArea = new FileDropArea(() => this.allowFileImport);

        const emptyMsgSpan = document.createElement("span");
        emptyMsgSpan.classList.add("info");
        this._emptyMsgSpan = emptyMsgSpan;

        const itemsContainer = document.createElement("div");
        itemsContainer.classList.add("itemcontainer");
        this._containerDiv = itemsContainer;

        const dragDummy = document.createElement("div");
        dragDummy.classList.add("item");
        dragDummy.classList.add("dragdummy");
        this._dragDummyDiv = dragDummy;

        itemsContainer.append(dragDummy);

        dropArea.append(emptyMsgSpan, itemsContainer);
        this.append(dropArea);

        document.addEventListener("mousemove", e => {
            if (Draggable.currentElement && Draggable.currentElement instanceof SoundItem) {
                if (!this._dragElement) {
                    this.showDragDummy();
                    this._dragElement = Draggable.currentElement;
                }
                this.handleDragOver(e);
            }
        });

        dropArea.onOver.addHandler(e => {
            this.showDragDummy();
            this.handleDragOver(e);
        });
        dropArea.onLeave.addHandler(() => {
            this.hideDragDummy();
        });
        dropArea.onDrop.addHandler(e => {
            void this.finishFileDrag(e);
        });
    }

    loadSounds(sounds: Sound[]): void {
        this.clear();
        for (const sound of sounds) {
            if (!this._dragElement || !Sound.equals(this._dragElement.sound, sound))
                this.addSound(sound);
        }
        this.filterSounds(this._filter);
    }

    showDragDummy(): void {
        this._dragDummyDiv.style.display = "inline-block";
    }

    hideDragDummy(): void {
        this.removeEventListener("mousemove", this.handleDragOver);
        this._dragDummyDiv.style.display = "";
    }

    filterSounds(filter: string): void {
        for (const soundItem of this._loadedSounds) {
            let isValid = !filter || soundItem.sound.name.contains(filter);
            const isCurrentDragElement = (!this._dragElement || soundItem != this._dragElement);
            isValid = isValid && isCurrentDragElement;
            soundItem.style.display = isValid ? "" : "none";
        }
        this.updateCurrentSoundContainer();
        this.updateMessage();
    }

    addSound(sound: Sound, index?: number): void {
        const item = new SoundItem(sound);

        item.onExpandRequested.addHandler(() => {
            if (this._currSubContainer?.parentSoundId === sound.uuid) {
                this.closeCurrentSubContainer();
            } else {
                this.openSubContainer(item);
            }
        });

        item.onDragStart.addHandler(() => {
            this._onSoundDragStart.raise(sound);
        });

        item.onDragEnd.addHandler(() => {
            const elem = this._dragElement;
            this._dragElement = null;
            if (elem) this.handleItemDrop(elem);
        });

        if (index === undefined) {
            this._containerDiv.append(item);
            this._loadedSounds.push(item);
        }
        else {
            const child = this._containerDiv.childNodes[index];
            if (child) {
                this._containerDiv.insertBefore(item, child);
                this._loadedSounds.splice(index, 0, item);
            }
            else {
                this._containerDiv.append(item);
                this._loadedSounds.push(item);
            }
        }
        this.updateMessage();
    }

    removeSound(sound: Sound): void {
        let i = 0;
        for (const item of this._loadedSounds) {
            if (Sound.equals(item.sound, sound)) {
                item.destroy();
                this._loadedSounds.splice(i, 1);
                this.updateMessage();
                return;
            }
            i++;
        }
        this.updateCurrentSoundContainer();
    }

    getHeight(): number {
        return this._containerDiv.offsetHeight;
    }

    // --- // ---

    private clear(): void {
        for (const item of this._loadedSounds) {
            item.destroy();
        }
        this._loadedSounds = [];
        this.updateMessage();
    }

    private hasVisibleSounds(): boolean {
        return this._loadedSounds.filter(x => window.getComputedStyle(x).display !== "none").length > 0;
    }

    private getDragDummyIndex(dragElement: SoundItem | null): number {
        return Utils.getElementIndex(this._dragDummyDiv, (e) => e != dragElement);
    }

    private updateMessage(): void {
        if (!this.hasVisibleSounds()) this.displayEmptyMessage(this.emptyMessageRequested());
        else this.displayEmptyMessage("");
    }

    private displayEmptyMessage(message: string): void {
        if (!message) {
            this._emptyMsgSpan.style.display = "none";
        } else {
            this._emptyMsgSpan.style.display = "";
            this._emptyMsgSpan.innerHTML = message;
        }
    }

    private async finishFileDrag(e: DragEvent): Promise<void> {
        const index = this.getDragDummyIndex(this._dragElement);
        this.hideDragDummy();
        this._onFileDropped.raise({ event: e, index: index });
    }

    private openSubContainer(under: SoundItem): void {
        this.closeCurrentSubContainer();
        const root = new SoundContainer(() => "No sounds in this group", under.sound.uuid);
        this._currSubContainer = root;
        root.classList.add("group");
        root.style.height = "0";
        under.after(root);

        if (Array.isArray(under.sound.source)) root.loadSounds(under.sound.source);
        const h = root.getHeight();

        void root.offsetWidth; // Trigger reflow
        root.style.height = `${h}px`;
    }

    private closeCurrentSubContainer(): void {
        if (!this._currSubContainer) return;
        // TODO: Close animation. Remove event listeners (destroy() function).
        this._currSubContainer.remove();
        this._currSubContainer = null;
    }

    // Checks if the container needs to be moved or closed.
    private updateCurrentSoundContainer(): void {
        if (!this._currSubContainer) return;
        const soundId = this._currSubContainer.parentSoundId;
        if (!soundId) return;
        const soundItem = this.findSoundItem(soundId);
        if (soundItem) {
            soundItem.after(this._currSubContainer);
            const isVisible = soundItem.style.display != "none";
            this._currSubContainer.style.display = isVisible ? "" : "none";
        } else {
            this.closeCurrentSubContainer();
        }
    }

    private findSoundItem(id: string): SoundItem | undefined {
        return this._loadedSounds.find(x => x.sound.uuid === id);
    }

    // Handlers

    private handleDragOver = (e: MouseEvent): void => {
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);

        if (!targetElement) return;
        if (!(targetElement instanceof SoundItem)) return;

        if (Utils.getElementIndex(this._dragDummyDiv) > Utils.getElementIndex(targetElement)) {
            this._containerDiv.insertBefore(this._dragDummyDiv, targetElement);
        } else {
            this._containerDiv.insertBefore(this._dragDummyDiv, targetElement.nextElementSibling);
        }
    };

    private handleItemDrop = (dragElement: SoundItem): void => {
        const newIndex = this.getDragDummyIndex(dragElement);
        this.hideDragDummy();
        this._onSoundDropped.raise({ index: newIndex, item: dragElement });
    };
}

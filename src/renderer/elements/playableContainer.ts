import { Event, ExposedEvent } from "../../shared/events";
import { isGroup } from "../../shared/models/group";
import { Playable, equals } from "../../shared/models/playable";
import { Draggable, FileDropArea, PlayableItem } from "../elements";
import Utils from "../util/utils";

// TODO: Must have all the containers in a hierarchy.
export interface DroppedEventArgs {
    item: PlayableItem,
    index: number,
    container: PlayableContainer,
}

export interface FileDroppedEventArgs {
    event: DragEvent,
    index: number,
}

type SubContainer = { container: PlayableContainer, parentUuid: string };

export default class PlayableContainer extends HTMLElement {
    private _loadedItems: PlayableItem[] = [];
    private _dragElement: PlayableItem | null = null;
    private _dragDummyDiv!: HTMLDivElement;
    private _containerDiv!: HTMLDivElement;
    private _emptyMsgSpan!: HTMLSpanElement;
    private _currSubContainer: SubContainer | null = null;

    public allowFileImport = true;

    private _filter = "";
    public get filter(): string { return this._filter; }
    public set filter(v: string) {
        this._filter = v;
        this.filterItems(v);
    }

    private _onItemDragStart = new Event<Playable>();
    public get onItemDragStart(): ExposedEvent<Playable> { return this._onItemDragStart.expose(); }

    private _onFileDropped = new Event<FileDroppedEventArgs>();
    public get onFileDropped(): ExposedEvent<FileDroppedEventArgs> { return this._onFileDropped.expose(); }

    private _onItemDropped = new Event<DroppedEventArgs>();
    public get onItemDropped(): ExposedEvent<DroppedEventArgs> { return this._onItemDropped.expose(); }

    public constructor(
        public readonly emptyMessageRequested: () => string,
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
            if (Draggable.currentElement && Draggable.currentElement instanceof PlayableItem) {
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

    loadItems(playables: Playable[]): void {
        this.clear();
        for (const playable of playables) {
            if (!this._dragElement || !equals(this._dragElement.playable, playable))
                this.addItem(playable);
        }
        this.filterItems(this._filter);
    }

    showDragDummy(): void {
        this._dragDummyDiv.style.display = "inline-block";
    }

    hideDragDummy(): void {
        this.removeEventListener("mousemove", this.handleDragOver);
        this._dragDummyDiv.style.display = "";
    }

    filterItems(filter: string): void {
        for (const item of this._loadedItems) {
            let isValid = !filter || item.playable.name.contains(filter);
            const isCurrentDragElement = (!this._dragElement || item != this._dragElement);
            isValid = isValid && isCurrentDragElement;
            item.style.display = isValid ? "" : "none";
        }
        this.updateCurrentContainer();
        this.updateMessage();
    }

    addItem(playable: Playable, index?: number): void {
        const item = new PlayableItem(playable);

        item.onExpandRequested.addHandler(() => {
            if (this._currSubContainer?.parentUuid === playable.uuid) {
                this.closeCurrentSubContainer();
            } else {
                this.openSubContainer(item);
            }
        });

        item.onDragStart.addHandler(() => {
            this._onItemDragStart.raise(playable);
        });

        item.onDragEnd.addHandler(() => {
            const elem = this._dragElement;
            this._dragElement = null;
            if (elem) this.handleItemDrop(elem);
        });

        if (index === undefined) {
            this._containerDiv.append(item);
            this._loadedItems.push(item);
        }
        else {
            const child = this._containerDiv.childNodes[index];
            if (child) {
                this._containerDiv.insertBefore(item, child);
                this._loadedItems.splice(index, 0, item);
            }
            else {
                this._containerDiv.append(item);
                this._loadedItems.push(item);
            }
        }
        this.updateMessage();
    }

    /** Recursively searches for the sub container where the element with the specified uuid belongs. */
    getElementLocation(uuid: string): PlayableContainer | undefined {
        if (!this._currSubContainer) return undefined;
        if (this._currSubContainer.parentUuid === uuid) {
            return this._currSubContainer.container;
        } else {
            return this._currSubContainer.container.getElementLocation(uuid);
        }
    }

    removeItem(playable: Playable): void {
        let i = 0;
        for (const item of this._loadedItems) {
            if (equals(item.playable, playable)) {
                item.destroy();
                this._loadedItems.splice(i, 1);
                this.updateMessage();
                return;
            }
            i++;
        }
        this.updateCurrentContainer();
    }

    getHeight(): number {
        return this._containerDiv.offsetHeight;
    }

    // --- // ---

    private clear(): void {
        for (const item of this._loadedItems) {
            item.destroy();
        }
        this._loadedItems = [];
        this.updateMessage();
    }

    private hasVisibleItems(): boolean {
        return this._loadedItems.filter(x => window.getComputedStyle(x).display !== "none").length > 0;
    }

    private getDragDummyIndex(dragElement: PlayableItem | null): number {
        return Utils.getElementIndex(this._dragDummyDiv, (e) => e != dragElement);
    }

    private updateMessage(): void {
        if (!this.hasVisibleItems()) this.displayEmptyMessage(this.emptyMessageRequested());
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

    private openSubContainer(under: PlayableItem): void {
        this.closeCurrentSubContainer();
        const root = new PlayableContainer(() => "No sounds in this group");
        this._currSubContainer = { container: root, parentUuid: under.playable.uuid };
        root.classList.add("group");
        root.style.height = "0";
        under.after(root);

        if (isGroup(under.playable)) root.loadItems(under.playable.playables);
        const h = root.getHeight();

        void root.offsetWidth; // Trigger reflow
        root.style.height = `${h}px`;
    }

    private closeCurrentSubContainer(): void {
        if (!this._currSubContainer) return;
        // TODO: Close animation. Remove event listeners in a destroy() function.
        this._currSubContainer.container.remove();
        this._currSubContainer = null;
    }

    // Checks if the container needs to be moved or closed.
    private updateCurrentContainer(): void {
        if (!this._currSubContainer) return;
        const id = this._currSubContainer.parentUuid;
        if (!id) return;
        const item = this.findItem(id);
        if (item) {
            item.after(this._currSubContainer.container);
            const isVisible = item.style.display != "none";
            this._currSubContainer.container.style.display = isVisible ? "" : "none";
        } else {
            this.closeCurrentSubContainer();
        }
    }

    private findItem(id: string): PlayableItem | undefined {
        return this._loadedItems.find(x => x.playable.uuid === id);
    }

    // Handlers

    private handleDragOver = (e: MouseEvent): void => {
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);

        if (!targetElement) return;
        if (!(targetElement instanceof PlayableItem)) return;

        if (Utils.getElementIndex(this._dragDummyDiv) > Utils.getElementIndex(targetElement)) {
            this._containerDiv.insertBefore(this._dragDummyDiv, targetElement);
        } else {
            this._containerDiv.insertBefore(this._dragDummyDiv, targetElement.nextElementSibling);
        }
    };

    private handleItemDrop = (dragElement: PlayableItem): void => {
        // TODO: Each container should listen to its subContainer itemDropped event (bubble up).
        const newIndex = this.getDragDummyIndex(dragElement);
        this.hideDragDummy();
        this._onItemDropped.raise({ index: newIndex, item: dragElement, container: this });
    };
}

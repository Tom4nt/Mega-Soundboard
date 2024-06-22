import { stringContains } from "../../shared/sharedUtils";
import { IPlayableData } from "../../shared/models/dataInterfaces";
import { FileDropArea, PlayableItem } from "../elements";
import Utils from "../util/utils";
import Actions from "../util/actions";
import { ContainerSortedArgs, IPlayableArgs, PlayableAddedArgs, Point } from "../../shared/interfaces";
import MSR from "../msr";
import { DragEventArgs } from "../draggableManager";

export default class PlayableContainer extends HTMLElement {
	private _loadedItems: PlayableItem[] = [];
	private _dragDummyDiv!: HTMLDivElement;
	private _containerDiv!: HTMLDivElement;
	private _emptyMsgSpan?: HTMLSpanElement;
	private _currSubContainer: PlayableContainer | null = null;
	private _isDraggingInside: boolean = false;

	/** The item that corresponds to the current playable being dragged.
	 * Since containers can be loaded and unloaded while dragging,
	 * we need to check if we load the item that is being dragged, 
	 * and store it here, to change its visibility in handleDragMove when needed. */
	private _loadedDraggedItem: PlayableItem | null = null;

	public allowFileImport = true;

	private _filter = "";
	public get filter(): string { return this._filter; }
	public set filter(v: string) {
		this._filter = v;
		this.filterItems(v);
	}

	public constructor(
		public readonly parentUuid: string,
		public readonly emptyMessageRequested: () => string,
	) { super(); }

	protected connectedCallback(): void {
		const dropArea = new FileDropArea(() => this.allowFileImport);
		dropArea.style.flexGrow = "1";

		const emptyMsgSpan = document.createElement("span");
		emptyMsgSpan.classList.add("info");
		this._emptyMsgSpan = emptyMsgSpan;

		const itemsContainer = document.createElement("div");
		itemsContainer.classList.add("itemcontainer");
		this._containerDiv = itemsContainer;

		const dragDummy = document.createElement("div");
		dragDummy.classList.add("dragdummy");
		this._dragDummyDiv = dragDummy;

		itemsContainer.append(dragDummy);

		dropArea.append(emptyMsgSpan, itemsContainer);
		this.append(dropArea);

		dropArea.onOver.addHandler(e => {
			this.showDragDummy();
			this.updateDragDummyPosition({ x: e.clientX, y: e.clientY });
		});
		dropArea.onLeave.addHandler(() => {
			this.hideDragDummy();
		});
		dropArea.onDrop.addHandler(e => {
			void this.finishFileDrag(e);
		});

		if (MSR.instance.draggableManager.currentGhost) {
			this.showDragDummy();
		}

		window.events.playableAdded.addHandler(this.handlePlayableAdded);
		window.events.playableRemoved.addHandler(this.handlePlayableRemoved);
		window.events.containerSorted.addHandler(this.handleContainerSorted);
		MSR.instance.draggableManager.onDragStart.addHandler(this.handleDragStart);
	}

	protected disconnectedCallback(): void {
		window.events.playableAdded.removeHandler(this.handlePlayableAdded);
		window.events.playableRemoved.removeHandler(this.handlePlayableRemoved);
		window.events.containerSorted.removeHandler(this.handleContainerSorted);
		MSR.instance.draggableManager.onDragStart.removeHandler(this.handleDragStart);
	}

	loadItems(playables: IPlayableArgs[]): void {
		this.clear();
		for (const playable of playables) {
			this.addItem(playable.data, undefined, playable.isPlaying);
		}
		this.filterItems(this._filter);
	}

	filterItems(filter: string): void {
		for (const item of this._loadedItems) {
			const isValid = !filter || stringContains(item.playable.name, filter);
			// const isCurrentDragElement = item === MSR.instance.draggableManager.currentElement;
			//isValid = isValid || isCurrentDragElement;
			item.style.display = isValid ? "" : "none";
		}
		this.updateCurrentContainer();
		this.updateMessage();
	}

	addItem(playable: IPlayableData, index?: number, isPlaying?: boolean): void {
		const item = new PlayableItem(playable, isPlaying);

		item.onExpandRequested.addHandler(() => {
			if (this._currSubContainer?.parentUuid === playable.uuid) {
				this.closeCurrentSubContainer();
			} else {
				void this.openSubContainer(item);
			}
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

		const d = MSR.instance.draggableManager.currentGhost;
		if (d instanceof PlayableItem && d.playable.uuid === playable.uuid) {
			this._loadedDraggedItem = item;
			this.updateLoadedDraggedItem();
		}
		this.updateMessage();
	}

	removeItem(uuid: string): void {
		let i = 0;
		for (const item of this._loadedItems) {
			if (item.playable.uuid === uuid) {
				if (item === this._loadedDraggedItem) this._loadedDraggedItem = null;
				item.remove();
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

	sort(uuids: string[]): void {
		const sorted = this._loadedItems.sort(
			(a, b) => uuids.indexOf(a.playable.uuid) - uuids.indexOf(b.playable.uuid));
		for (const item of sorted) {
			this._containerDiv.append(item);
		}
	}

	dragItem(pos: Point): void {
		this._isDraggingInside = true;
		this.updateLoadedDraggedItem();
		this.showDragDummy();
		this.updateDragDummyPosition(pos);
	}

	dragItemOutside(): void {
		this._isDraggingInside = false;
		this.updateLoadedDraggedItem();
		this.hideDragDummy();
	}

	dropItem(dragElement: PlayableItem): void {
		const newIndex = this.getDragDummyIndex();
		this.hideDragDummy();
		if (this._loadedDraggedItem) {
			this._loadedDraggedItem.hidden = false;
			this._loadedDraggedItem = null;
		}

		const destinationUUID = this.parentUuid;
		if (dragElement.inCopyMode) {
			window.actions.copyPlayable(dragElement.playable.uuid, destinationUUID, newIndex);
		} else {
			window.actions.movePlayable(dragElement.playable.uuid, destinationUUID, newIndex);
		}
	}

	// ---

	private showDragDummy(): void {
		this._dragDummyDiv.style.display = "inline-block";
		if (this._emptyMsgSpan) this._emptyMsgSpan.style.display = "none";
		this.updateMessageSpanVisibility();
	}

	private hideDragDummy(): void {
		this._dragDummyDiv.style.display = "";
		if (this._emptyMsgSpan) this._emptyMsgSpan.style.display = "";
		this.updateMessageSpanVisibility();
	}

	private updateDragDummyPosition(pos: Point): void {
		const targetElements = document.elementsFromPoint(pos.x, pos.y);
		const targetElement = targetElements.find(x => x instanceof PlayableItem);
		if (!targetElement) return;

		if (Utils.getElementIndex(this._dragDummyDiv) > Utils.getElementIndex(targetElement)) {
			this._containerDiv.insertBefore(this._dragDummyDiv, targetElement);
		} else {
			this._containerDiv.insertBefore(this._dragDummyDiv, targetElement.nextElementSibling);
		}
	}

	private clear(): void {
		for (const item of this._loadedItems) {
			item.remove();
		}
		this._loadedItems = [];
		this._loadedDraggedItem = null;
		this.updateMessage();
	}

	private hasVisibleItems(): boolean {
		return this._loadedItems.filter(x => window.getComputedStyle(x).display !== "none").length > 0;
	}

	private getDragDummyIndex(): number {
		const dragItemHidden = this._loadedDraggedItem?.hidden ?? true;
		return Utils.getElementIndex(this._dragDummyDiv, (e) => !dragItemHidden || e != this._loadedDraggedItem);
	}

	private updateMessage(): void {
		if (!this.hasVisibleItems()) this.displayEmptyMessage(this.emptyMessageRequested());
		else this.displayEmptyMessage("");
	}

	private displayEmptyMessage(message: string): void {
		if (!this._emptyMsgSpan) return;
		this._emptyMsgSpan.innerHTML = message;
		this.updateMessageSpanVisibility();
	}

	private updateMessageSpanVisibility(): void {
		if (!this._emptyMsgSpan) return;
		const visible = this._emptyMsgSpan.innerHTML != "" && window.getComputedStyle(this._dragDummyDiv).display == "none";
		this._emptyMsgSpan.style.display = visible ? "" : "none";
	}

	private async finishFileDrag(e: DragEvent): Promise<void> {
		const index = this.getDragDummyIndex();
		this.hideDragDummy();
		const paths = await Utils.getValidSoundPaths(e);
		if (paths)
			await Actions.addSounds(paths, this.parentUuid, index);
	}

	private async openSubContainer(under: PlayableItem): Promise<void> {
		this.closeCurrentSubContainer();
		const root = new PlayableContainer(under.playable.uuid, () => "No sounds in this group");
		this._currSubContainer = root;
		root.classList.add("group");
		root.style.height = "0";
		under.after(root);

		const items = await window.actions.getContainerItems(under.playable.uuid);
		if (under.playable.isGroup) root.loadItems(items);
		const h = root.getHeight();

		void root.offsetWidth; // Trigger reflow
		root.style.height = `${h}px`;
	}

	private closeCurrentSubContainer(): void {
		if (!this._currSubContainer) return;
		// TODO: Close animation.
		this._currSubContainer.remove();
		this._currSubContainer = null;
	}

	// Checks if the container needs to be moved or closed.
	private updateCurrentContainer(): void {
		if (!this._currSubContainer) return;
		const id = this._currSubContainer.parentUuid;
		if (!id) return;
		const item = this.findItem(id);
		if (item) {
			item.after(this._currSubContainer);
			const isVisible = item.style.display != "none";
			this._currSubContainer.style.display = isVisible ? "" : "none";
		} else {
			this.closeCurrentSubContainer();
		}
	}

	private findItem(id: string): PlayableItem | undefined {
		return this._loadedItems.find(x => x.playable.uuid === id);
	}

	private updateLoadedDraggedItem(): void {
		const d = MSR.instance.draggableManager.currentGhost;
		if (this._loadedDraggedItem && d instanceof PlayableItem) {
			this._loadedDraggedItem.hidden = !d.inCopyMode || !this._isDraggingInside;
		}
	}

	// Handlers

	private handleDragStart = (e: DragEventArgs): void => {
		if (e.ghost instanceof PlayableItem && !this._loadedDraggedItem) {
			this._loadedDraggedItem = this.findItem(e.ghost.playable.uuid) ?? null;
		}
	};

	private handlePlayableAdded = (e: PlayableAddedArgs): void => {
		if (e.parentUuid === this.parentUuid) {
			this.addItem(e.playable, e.index, e.isPlaying);
		}
	};

	private handlePlayableRemoved = (e: IPlayableData): void => {
		this.removeItem(e.uuid);
	};

	private handleContainerSorted = (c: ContainerSortedArgs): void => {
		if (this.parentUuid === c.containerUuid) {
			this.sort(c.itemsUuids);
		}
	};
}

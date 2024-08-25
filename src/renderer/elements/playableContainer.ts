import { stringContains } from "../../shared/sharedUtils";
import { IBaseData } from "../../shared/models/dataInterfaces";
import { FileDropArea, PlayableItem } from "../elements";
import Utils from "../util/utils";
import Actions from "../util/actions";
import { ContainerSortedArgs, IPlayableArgs, PlayablesAddedArgs, Point } from "../../shared/interfaces";
import MSR from "../msr";
import { DragEventArgs, DragPreStartArgs } from "../draggableManager";
import ContainerHelper from "../util/containerHelper";

export default class PlayableContainer extends HTMLElement {
	private readonly _loadedItems: PlayableItem[] = [];
	private _dragDummyDiv!: HTMLDivElement;
	private _containerDiv!: HTMLDivElement;
	private _emptyMsgSpan?: HTMLSpanElement;
	private _currSubContainer: PlayableContainer | null = null;
	private _initialized = false;
	private _containerHelper!: ContainerHelper;

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

	public get filteredItems(): PlayableItem[] {
		return this._loadedItems.filter(i => !i.hidden);
	}

	public constructor(
		public readonly parentUuid: string,
		public readonly emptyMessageRequested: () => string,
		public readonly allowGroupCreation: boolean,
	) { super(); }

	protected connectedCallback(): void {
		window.events.playablesAdded.addHandler(this.handlePlayableAdded);
		window.events.playableRemoved.addHandler(this.handlePlayableRemoved);
		window.events.containerSorted.addHandler(this.handleContainerSorted);
		MSR.instance.draggableManager.onDragPreStart.addHandler(this.handleDragPreStart);
		MSR.instance.draggableManager.onDragStart.addHandler(this.handleDragStart);

		if (this._initialized) return;

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
			const index = this._containerHelper.getIndexAtPosition({ x: e.clientX, y: e.clientY });
			if (index !== null) this.updateDragDummyPosition(index);
			else this.hideDragDummy();
		});
		dropArea.onLeave.addHandler(() => {
			this.hideDragDummy();
		});
		dropArea.onDrop.addHandler(e => {
			const index = this._containerHelper.getIndexAtPosition({ x: e.clientX, y: e.clientY });
			if (index !== null) void this.finishFileDrag(e);
		});

		if (MSR.instance.draggableManager.currentGhost) {
			this.showDragDummy();
		}

		const padding = parseInt(window.getComputedStyle(itemsContainer).padding);
		this._containerHelper = new ContainerHelper(this, itemsContainer, padding, () => this._currSubContainer);
		this._initialized = true;
	}

	protected disconnectedCallback(): void {
		window.events.playablesAdded.removeHandler(this.handlePlayableAdded);
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
		this.updateCurrentSubContainer();
		this.updateMessage();
	}

	addItem(playable: IBaseData, index?: number, isPlaying?: boolean): void {
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
			const itemAtIndex = this._loadedItems[index];
			const child = this.findItem(itemAtIndex?.playable.uuid ?? "");
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
				if (uuid === this._currSubContainer?.parentUuid) {
					this.closeCurrentSubContainer();
				}
				item.remove();
				this._loadedItems.splice(i, 1);
				this.updateMessage();
				return;
			}
			i++;
		}
		this.updateCurrentSubContainer();
	}

	getHeight(): number {
		if (!(this.firstElementChild instanceof HTMLElement)) return 0;
		return this.firstElementChild.offsetHeight;
	}

	sort(uuids: string[]): void {
		const sorted = this._loadedItems.sort(
			(a, b) => uuids.indexOf(a.playable.uuid) - uuids.indexOf(b.playable.uuid));
		for (const item of sorted) {
			this._containerDiv.append(item);
		}
		this.updateCurrentSubContainer();
	}

	dragItem(pos: Point, item: PlayableItem): void {
		const index = this._containerHelper.getIndexAtPosition(pos);
		let overElements = document.elementsFromPoint(pos.x, pos.y);
		if (index === null) {
			if (this._currSubContainer) this._currSubContainer.dragItem(pos, item);
			this.dragItemOutside();

		} else {
			if (this._currSubContainer) {
				this._currSubContainer.dragItemOutside();
			}

			item.canBeInGroupMode = this.allowGroupCreation;
			if (item.inGroupMode) {
				this.hideDragDummy();
			} else {
				this.showDragDummy();
			}
			this.updateLoadedDraggedItem();
			this.updateDragDummyPosition(index);

			overElements = document.elementsFromPoint(pos.x, pos.y);
			if (item.inGroupMode) {
				const playableAtMouse = overElements.find(i => i instanceof PlayableItem);
				if (playableAtMouse instanceof PlayableItem && this.allowGroupCreation) {
					item.groupTarget = playableAtMouse.playable.isGroup ? "group" : "sound";
				} else {
					item.groupTarget = "none";
				}
			} else {
				item.groupTarget = "none";
			}
		}
	}

	dragItemOutside(): void {
		this.updateLoadedDraggedItem();
		this.hideDragDummy();
	}

	dropItem(pos: Point, dragElement: PlayableItem): void {
		const newIndex = this._containerHelper.getIndexAtPosition(pos);
		const elementsAtPoint = document.elementsFromPoint(pos.x, pos.y);
		const playableAtPoint = elementsAtPoint.find(x => x instanceof PlayableItem);

		if (newIndex === null) {
			if (this._currSubContainer !== null) this._currSubContainer.dropItem(pos, dragElement);
			return;
		}

		this.hideDragDummy();

		if (this._loadedDraggedItem) {
			this._loadedDraggedItem.hidden = false;
			this._loadedDraggedItem = null;
		}

		if (dragElement.groupTarget === "sound") {
			if (playableAtPoint instanceof PlayableItem) {
				window.actions.createGroup(playableAtPoint.playable.uuid, dragElement.playable.uuid, dragElement.inCopyMode);
			}
		} else if (dragElement.groupTarget === "group") {
			if (playableAtPoint instanceof PlayableItem) {
				window.actions.copyOrMovePlayable(dragElement.playable.uuid, playableAtPoint.playable.uuid, !dragElement.inCopyMode, 0);
			}
		} else {
			const destinationUUID = this.parentUuid;
			window.actions.copyOrMovePlayable(dragElement.playable.uuid, destinationUUID, !dragElement.inCopyMode, newIndex);
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

	private updateDragDummyPosition(index: number): void {
		const item = this.filteredItems[index] ?? null;
		this._containerDiv.insertBefore(this._dragDummyDiv, item);
	}

	private clear(): void {
		for (const item of this._loadedItems) {
			item.remove();
		}
		this._loadedItems.length = 0;
		this._loadedDraggedItem = null;
		this.updateMessage();
	}

	private hasVisibleItems(): boolean {
		return this._loadedItems.filter(x => window.getComputedStyle(x).display !== "none").length > 0;
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
		const index = this._containerHelper.getIndexAtPosition({ x: e.clientX, y: e.clientY });

		if (index === null) {
			if (this._currSubContainer !== null) void this._currSubContainer.finishFileDrag(e);
			return;
		}

		this.hideDragDummy();
		const paths = await Utils.getValidSoundPaths(e);
		if (paths)
			await Actions.addSounds(paths, this.parentUuid, index);
	}

	private async openSubContainer(under: PlayableItem): Promise<void> {
		this.closeCurrentSubContainer();
		const root = new PlayableContainer(under.playable.uuid, () => "No sounds in this group", false);
		this._currSubContainer = root;
		root.classList.add("group");
		root.style.height = "0";
		root.style.margin = "0";
		under.showGroupArrow = true;
		under.after(root);

		const items = await window.actions.getContainerItems(under.playable.uuid);
		if (under.playable.isGroup) root.loadItems(items);
		const h = root.getHeight();

		root.style.height = `${h}px`;
		root.style.margin = "";
		void root.offsetWidth; // Trigger reflow 
		setTimeout(() => { root.style.height = ""; }, 200);
	}

	private closeCurrentSubContainer(): void {
		if (!this._currSubContainer) return;
		const container = this._currSubContainer;

		const item = this.findItem(container.parentUuid);
		if (item) item.showGroupArrow = false;

		container.style.height = `${container.getHeight()}px`;
		void container.offsetWidth; // Trigger reflow
		container.style.height = "0px";
		container.style.margin = "0";
		this._currSubContainer = null;
		setTimeout(() => { container.remove(); }, 200);
	}

	// Checks if the sub-container needs to be moved or closed.
	private updateCurrentSubContainer(): void {
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
			this._loadedDraggedItem.hidden = !d.inCopyMode || d.inGroupMode;
		}
	}

	// Handlers

	private handleDragPreStart = (e: DragPreStartArgs): void => {
		if (e.element instanceof PlayableItem) {
			e.cancel = this.filter !== "";
		}
	};

	private handleDragStart = (e: DragEventArgs): void => {
		if (e.ghost instanceof PlayableItem && !this._loadedDraggedItem) {
			this._loadedDraggedItem = this.findItem(e.ghost.playable.uuid) ?? null;
			if (this._currSubContainer?.parentUuid === e.ghost.playable.uuid) {
				this.closeCurrentSubContainer();
			}
		}
	};

	private handlePlayableAdded = (e: PlayablesAddedArgs): void => {
		if (e.parentUuid === this.parentUuid) {
			let index = e.index;
			for (const playableArgs of e.playables) {
				this.addItem(playableArgs.playable, index, playableArgs.isPlaying);
				if (index !== undefined) index += 1;
			}
		}
	};

	private handlePlayableRemoved = (e: IBaseData): void => {
		this.removeItem(e.uuid);
	};

	private handleContainerSorted = (c: ContainerSortedArgs): void => {
		if (this.parentUuid === c.containerUuid) {
			this.sort(c.itemsUuids);
		}
	};
}

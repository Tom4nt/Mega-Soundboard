import { stringContains } from "../../shared/sharedUtils";
import { IPlayableData } from "../../shared/models/dataInterfaces";
import { Draggable, FileDropArea, PlayableItem } from "../elements";
import Utils from "../util/utils";
import Actions from "../util/actions";
import { ContainerSortedArgs, PlayableAddedArgs } from "../../shared/interfaces";

export default class PlayableContainer extends HTMLElement {
	private _loadedItems: PlayableItem[] = [];
	private _dragDummyDiv!: HTMLDivElement;
	private _containerDiv!: HTMLDivElement;
	private _emptyMsgSpan?: HTMLSpanElement;
	private _currSubContainer: PlayableContainer | null = null;

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

		document.addEventListener("mousemove", this.handleMouseMove);

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

		window.events.playableAdded.addHandler(this.handlePlayableAdded);
		window.events.playableRemoved.addHandler(this.handlePlayableRemoved);
		window.events.containerSorted.addHandler(this.handleContainerSorted);
		Draggable.onGlobalDragEnd.addHandler(this.handleDragEnd);
	}

	protected disconnectedCallback(): void {
		document.removeEventListener("mousemove", this.handleMouseMove);

		window.events.playableAdded.removeHandler(this.handlePlayableAdded);
		window.events.playableRemoved.removeHandler(this.handlePlayableRemoved);
		window.events.containerSorted.removeHandler(this.handleContainerSorted);
		Draggable.onGlobalDragEnd.removeHandler(this.handleDragEnd);
	}

	loadItems(playables: IPlayableData[]): void {
		this.clear();
		const d = Draggable.currentElement instanceof PlayableItem ? Draggable.currentElement : null;
		for (const playable of playables) {
			if (!d || d.playable.uuid !== playable.uuid)
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
			let isValid = !filter || stringContains(item.playable.name, filter);
			const isCurrentDragElement = item === Draggable.currentElement;
			isValid = isValid || isCurrentDragElement;
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
		this.updateMessage();
	}

	removeItem(uuid: string): void {
		let i = 0;
		for (const item of this._loadedItems) {
			if (item.playable.uuid === uuid) {
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

	// --- // ---

	private clear(): void {
		for (const item of this._loadedItems) {
			item.remove();
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
		if (!this._emptyMsgSpan) return;
		if (!message) {
			this._emptyMsgSpan.style.display = "none";
		} else {
			this._emptyMsgSpan.style.display = "";
			this._emptyMsgSpan.innerHTML = message;
		}
	}

	private async finishFileDrag(e: DragEvent): Promise<void> {
		const index = this.getDragDummyIndex(null);
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

	// Handlers

	private handleDragOver = (e: MouseEvent): void => {
		const targetElements = document.elementsFromPoint(e.clientX, e.clientY);
		const targetElement = targetElements.find(x => x instanceof PlayableItem);
		if (!targetElement) return;

		if (Utils.getElementIndex(this._dragDummyDiv) > Utils.getElementIndex(targetElement)) {
			this._containerDiv.insertBefore(this._dragDummyDiv, targetElement);
		} else {
			this._containerDiv.insertBefore(this._dragDummyDiv, targetElement.nextElementSibling);
		}
	};

	private handleItemDrop = async (dragElement: PlayableItem): Promise<void> => {
		const newIndex = this.getDragDummyIndex(dragElement);
		this.hideDragDummy();

		const id = this.parentUuid;
		const destinationUUID = dragElement.draggingToNewSoundboard ? null : id;
		if (dragElement.dragMode === "copy") {
			await window.actions.copyPlayable(dragElement.playable.uuid, destinationUUID, newIndex);
		} else {
			await window.actions.movePlayable(dragElement.playable.uuid, destinationUUID, newIndex);
		}
	};

	private handleMouseMove = (e: MouseEvent): void => {
		if (Draggable.currentElement && Draggable.currentElement instanceof PlayableItem) {
			this.showDragDummy();
			this.handleDragOver(e);
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

	private handleDragEnd = (d: Draggable): void => {
		if (d instanceof PlayableItem) void this.handleItemDrop(d);
	};
}

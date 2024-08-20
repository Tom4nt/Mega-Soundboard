import Keys from "../../shared/keys";
import Draggable from "./draggable";
import Actions from "../util/actions";
import KeyStateListener from "../util/keyStateListener";
import { Event, ExposedEvent } from "../../shared/events";
import { IBaseData, UuidHierarchyData } from "../../shared/models/dataInterfaces";
import DraggableHint from "./draggableHint";
import MSR from "../msr";
import { calls } from "../../shared/decorators";
import { Point } from "../../shared/interfaces";

export default class PlayableItem extends Draggable {
	private rootElement!: HTMLDivElement;
	private titleElement!: HTMLSpanElement;
	private detailsElement!: HTMLSpanElement;
	private indicatorElement!: HTMLDivElement;
	private groupArrow!: HTMLDivElement;
	private currentKeyStateListener: KeyStateListener | null = null;
	private dragHint: DraggableHint | null = null;
	private _inCopyMode = false;
	private _inGroupMode = false;

	private _expandRequested = new Event<PlayableItem>();
	public get onExpandRequested(): ExposedEvent<PlayableItem> { return this._expandRequested.expose(); }

	public get inCopyMode(): boolean { return this._inCopyMode; }
	public get inGroupMode(): boolean { return this._inGroupMode; }

	public get showGroupArrow(): boolean { return !this.groupArrow.hidden; }
	public set showGroupArrow(value: boolean) {
		this.groupArrow.hidden = !value;
	}

	@calls("updateDragState")
	accessor isMovingToNewLocation = false;

	@calls("updateDragState")
	accessor canRemoveFromCurrentLocation = false;

	@calls("updateDragState")
	accessor canAddToNewLocation = false;

	@calls("updateDragState")
	accessor newLocationName = "";

	@calls("updateDragState")
	accessor groupTarget: "none" | "sound" | "group" = "none";

	@calls("updateDragState")
	accessor canBeInGroupMode = true;

	constructor(public playable: IBaseData, isPlaying: boolean = false) {
		super();
		this.init(isPlaying);
	}

	protected connectedCallback(): void {
		super.connectedCallback();
		this.addGlobalListeners();
	}

	protected disconnectedCallback(): void {
		super.disconnectedCallback();
		this.removeGlobalListeners();

		if (this.currentKeyStateListener)
			this.currentKeyStateListener.onStateChanged.removeHandler(this.handleKeyStateChanged);
	}

	public setPlayingState(playingState: boolean): void {
		if (playingState) {
			this.indicatorElement.style.top = "-11px";
			this.indicatorElement.style.right = "-11px";
		} else {
			this.indicatorElement.style.top = "";
			this.indicatorElement.style.right = "";
		}
	}

	public update(): void {
		this.titleElement.innerHTML = this.playable.name;
		this.detailsElement.innerHTML = Keys.toKeyString(this.playable.keys);
	}

	public updateDragState(): void {
		if (!this.dragHint || !this.currentKeyStateListener) return;
		const h = this.dragHint;
		h.canCopy = this.canAddToNewLocation;
		h.canMove = !this.isMovingToNewLocation || (this.canAddToNewLocation && this.canRemoveFromCurrentLocation);
		h.prefersCopy = this.currentKeyStateListener.isCtrlPressed;
		h.destinationName = this.isMovingToNewLocation ? this.newLocationName : "";
		this._inGroupMode = this.canBeInGroupMode && this.currentKeyStateListener.isShiftPressed && this.canAddToNewLocation;
		h.groupTarget = this._inGroupMode ? this.groupTarget : "none";
		this._inCopyMode = h.prefersCopy && h.canCopy;
		MSR.instance.draggableManager.update();
	}

	protected createGhost(_position: Point, offset: Point): PlayableItem {
		const newItem = new PlayableItem(this.playable);
		// Since the element will be outside of the container, we need to set some with.
		newItem.style.width = `${this.offsetWidth}px`;
		newItem.setAsDraggableGhost(offset);
		return newItem;
	}

	private init(isPlaying: boolean): void {
		const left = document.createElement("div");
		left.style.minWidth = "0";
		left.style.padding = "8px";
		left.style.flexGrow = "1";

		const right = document.createElement("div");
		right.style.padding = "14px";
		right.style.alignSelf = "stretch";

		this.titleElement = document.createElement("span");
		this.titleElement.style.pointerEvents = "none";

		this.detailsElement = document.createElement("span");
		this.detailsElement.classList.add("desc");
		this.detailsElement.style.pointerEvents = "none";

		this.indicatorElement = document.createElement("div");
		this.indicatorElement.classList.add("indicator");
		this.setPlayingState(isPlaying);

		const expandIcon = document.createElement("i");
		expandIcon.style.fontSize = "24px";
		expandIcon.innerText = "view_list";

		this.update();
		left.append(this.titleElement, this.detailsElement);
		right.append(expandIcon);

		const root = document.createElement("div");
		root.classList.add("root");
		this.rootElement = root;

		const items: Node[] = [
			left, ...this.playable.isGroup ? [right] : [], this.indicatorElement
		];
		root.append(...items);

		const groupArrow = document.createElement("div");
		groupArrow.className = "group-arrow";
		groupArrow.hidden = true;
		this.groupArrow = groupArrow;

		this.append(root, groupArrow);

		const handleClick = async (e: MouseEvent): Promise<void> => {
			if (e.target === this.indicatorElement) return;
			window.actions.play(this.playable.uuid);
		};

		left.addEventListener("click", e => void handleClick(e));
		right.addEventListener("click", () => this._expandRequested.raise(this));

		this.addEventListener("auxclick", e => {
			if (e.button === 1) {
				window.actions.stop(this.playable.uuid);
			}
		});

		this.addEventListener("contextmenu", () => {
			void Actions.editPlayable(this.playable.uuid, this.playable.isGroup);
		});

		this.indicatorElement.addEventListener("click", () => {
			window.actions.stop(this.playable.uuid);
		});
	}

	private addGlobalListeners(): void {
		window.events.playing.addHandler(this.handlePlaying);
		window.events.notPlaying.addHandler(this.handleNotPlaying);
		window.events.playableChanged.addHandler(this.handlePlayableChanged);
	}

	private removeGlobalListeners(): void {
		window.events.playing.removeHandler(this.handlePlaying);
		window.events.notPlaying.removeHandler(this.handleNotPlaying);
		window.events.playableChanged.removeHandler(this.handlePlayableChanged);
	}

	private setAsDraggableGhost(offset: Point): void {
		this.dragHint = new DraggableHint();
		this.dragHint.style.top = offset.y + "px";
		this.dragHint.style.left = offset.x + "px";
		this.append(this.dragHint);
		this.rootElement.classList.add("drag");
		this.currentKeyStateListener = new KeyStateListener();
		this.currentKeyStateListener.onStateChanged.addHandler(this.handleKeyStateChanged);
	}

	// Handlers

	private handleKeyStateChanged = (): void => {
		this.updateDragState();
	};

	private handlePlaying = (h: UuidHierarchyData): void => {
		if (h.includes(this.playable.uuid))
			this.setPlayingState(true);
	};

	private handleNotPlaying = (h: UuidHierarchyData): void => {
		if (h.includes(this.playable.uuid))
			this.setPlayingState(false);
	};

	private handlePlayableChanged = (playable: IBaseData): void => {
		if (playable.uuid === this.playable.uuid) {
			this.playable = playable;
			this.update();
		}
	};
}

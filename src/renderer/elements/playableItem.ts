import Keys from "../../shared/keys";
import Draggable from "./draggable";
import Actions from "../util/actions";
import KeyStateListener from "../util/keyStateListener";
import { Event, ExposedEvent } from "../../shared/events";
import { IPlayableData, UuidHierarchyData } from "../../shared/models/dataInterfaces";

type SimpleSoundboard = { uuid: string, name: string, isLinked: boolean };
type DragSession = { sourceSoundboard: SimpleSoundboard, targetSoundboard: SimpleSoundboard | null };

export default class PlayableItem extends Draggable {
	private titleElement!: HTMLSpanElement;
	private detailsElement!: HTMLSpanElement;
	private indicatorElement!: HTMLDivElement;
	private currentKeyStateListener: KeyStateListener | null = null;
	private _draggingToNewSoundboard = false;
	private currentDragSession: DragSession | null = null;

	public get draggingToNewSoundboard(): boolean { return this._draggingToNewSoundboard; }
	public set draggingToNewSoundboard(v: boolean) {
		this._draggingToNewSoundboard = v;
		if (this.currentDragSession)
			void this.updateHint(undefined);
	}

	private _expandRequested = new Event<PlayableItem>();
	public get onExpandRequested(): ExposedEvent<PlayableItem> { return this._expandRequested.expose(); }

	// eslint-disable-next-line class-methods-use-this
	protected get classDuringDrag(): string {
		return "drag";
	}

	constructor(public playable: IPlayableData, isPlaying: boolean = false) {
		super();
		this.init(isPlaying);
	}

	protected connectedCallback(): void {
		this.addGlobalListeners();
	}

	protected disconnectedCallback(): void {
		this.removeGlobalListeners();
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

	public updateHint(targetSb?: SimpleSoundboard): void {
		if (!this.currentDragSession) return;
		if (targetSb) this.currentDragSession.targetSoundboard = targetSb;
		const targetSB = this.currentDragSession.targetSoundboard;
		const sourceSB = this.currentDragSession.sourceSoundboard;
		const isSameSB = targetSB?.uuid === sourceSB.uuid && !this.draggingToNewSoundboard;
		let sbName = isSameSB ? "" : targetSB?.name ?? "";
		if (this.draggingToNewSoundboard) sbName = "new soundboard";
		const copies = this.getHintMode(
			this.currentKeyStateListener?.isCtrlPressed ?? false, isSameSB, this.currentDragSession.sourceSoundboard.isLinked
		);
		const prefix = sbName ?
			(copies ? "Copy to " : "Move to ") :
			(copies ? "Copy" : "");
		super.setDragHint(prefix + sbName, copies ? "copy" : "move");
	}

	public update(): void {
		this.titleElement.innerHTML = this.playable.name;
		this.detailsElement.innerHTML = Keys.toKeyString(this.playable.keys);
	}

	public clone(): PlayableItem {
		const newItem = new PlayableItem(this.playable);
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

		const items: Node[] = [
			left, ...this.playable.isGroup ? [right] : [], this.indicatorElement
		];
		this.append(...items);

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
			void Actions.editPlayable(this.playable.uuid);
		});

		this.indicatorElement.addEventListener("click", () => {
			window.actions.stop(this.playable.uuid);
		});

		this.onDragStart.addHandler(async (c) => {
			const sb = await window.actions.getPlayableRoot(this.playable.uuid);
			if (!sb) {
				c.cancel = true;
				return;
			}
			const simpleSb: SimpleSoundboard = { name: sb.name, isLinked: sb.linkedFolder != null, uuid: sb.uuid };
			this.currentDragSession = { sourceSoundboard: simpleSb, targetSoundboard: null };
			this.currentKeyStateListener = new KeyStateListener();
			this.currentKeyStateListener.onStateChanged.addHandler(async () => {
				this.updateHint(undefined);
			});
		});

		this.onDragEnd.addHandler(() => {
			this.currentKeyStateListener?.finish();
			this.currentKeyStateListener = null;
		});
	}

	private addGlobalListeners(): void {
		window.events.playing.addHandler(this.handlePlaying);
		window.events.notPlaying.addHandler(this.handleNotPlaying);
		window.events.playableChanged.addHandler(this.handlePlayableChanged);
		window.events.keybindPressed.addHandler(this.handleKeybindPressed);
	}

	private removeGlobalListeners(): void {
		window.events.playing.removeHandler(this.handlePlaying);
		window.events.notPlaying.removeHandler(this.handleNotPlaying);
		window.events.playableChanged.removeHandler(this.handlePlayableChanged);
		window.events.keybindPressed.removeHandler(this.handleKeybindPressed);
	}

	private getHintMode(wantsCopy: boolean, isSameSoundboard: boolean, isLinkedSoundboard: boolean): boolean {
		let copies = wantsCopy;
		if (isLinkedSoundboard) copies = !isSameSoundboard;
		this.dragMode = copies ? "copy" : "move";
		return copies;
	}

	// Handlers

	private handlePlaying = (h: UuidHierarchyData): void => {
		if (h.includes(this.playable.uuid))
			this.setPlayingState(true);
	};

	private handleNotPlaying = (h: UuidHierarchyData): void => {
		if (h.includes(this.playable.uuid))
			this.setPlayingState(false);
	};

	private handlePlayableChanged = (playable: IPlayableData): void => {
		if (playable.uuid === this.playable.uuid) {
			this.playable = playable;
			this.update();
		}
	};

	private handleKeybindPressed = async (keys: number[]): Promise<void> => {
		// TODO: Handle keybind presses in the main process
		if (Keys.equals(keys, this.playable.keys)) {
			try {
				// const data = await window.actions.getPlayData(this.playable.uuid);
				// if (data) await MSR.instance.audioManager.play(data);
			} catch (error) {
				// await MSR.instance.audioManager.playUISound(UISoundPath.ERROR);
			}
		}
	};
}

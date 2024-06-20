import Keys from "../../shared/keys";
import { ISoundboardData, UuidHierarchyData } from "../../shared/models/dataInterfaces";
import { PlayableItem, Tooltip } from "../elements";
import MSR from "../msr";
import Actions from "../util/actions";
import Draggable from "./draggable";

export default class SoundboardItem extends Draggable {
	private iconElement!: HTMLSpanElement;
	private titleElement!: HTMLSpanElement;
	private descriptionElement!: HTMLSpanElement;

	get isSelected(): boolean {
		return this.classList.contains("selected");
	}
	set isSelected(v: boolean) {
		if (v) this.classList.add("selected");
		else this.classList.remove("selected");
	}

	constructor(public soundboard: ISoundboardData) {
		super();
		this.lockHorizontal = true;
	}

	protected connectedCallback(): void {
		super.connectedCallback();

		this.addEventListener("auxclick", this.handleAuxClick);
		this.addEventListener("contextmenu", this.handleContextMenu);
		this.addEventListener("click", this.handleClick);
		this.addEventListener("mousemove", this.handleMouseMove);
		this.addEventListener("dragover", this.handleDragOver);

		window.events.soundboardChanged.addHandler(this.handleSoundboardChanged);
		window.events.keybindPressed.addHandler(this.handleKeybindPressed);
		window.events.playing.addHandler(this.handlePlaying);
		window.events.notPlaying.addHandler(this.handleNotPlaying);

		this.init();
	}

	protected disconnectedCallback(): void {
		super.disconnectedCallback();

		window.events.soundboardChanged.removeHandler(this.handleSoundboardChanged);
		window.events.keybindPressed.removeHandler(this.handleKeybindPressed);
		window.events.playing.removeHandler(this.handlePlaying);
		window.events.notPlaying.removeHandler(this.handleNotPlaying);
	}

	protected createGhost(): Draggable {
		const ghost = new SoundboardItem(this.soundboard);
		ghost.style.width = this.clientWidth + "px";
		return ghost;
	}

	private init(): void {
		this.classList.add("item");

		const indicator = document.createElement("div");
		indicator.classList.add("indicator");

		const title = document.createElement("span");
		title.classList.add("title");
		this.titleElement = title;

		const desc = document.createElement("span");
		desc.classList.add("desc");
		this.descriptionElement = desc;

		const icon = document.createElement("i");
		this.iconElement = icon;
		if (this.soundboard.linkedFolder) icon.innerHTML = "link";

		const tt = new Tooltip();
		tt.tooltipText = "This soundboard is linked to a folder";
		tt.attach(icon);

		this.append(indicator, title, desc, icon);

		this.updateElements();
	}

	private safeSelect(ignoreLinked: boolean): void {
		const isLinked = this.soundboard.linkedFolder !== null;
		if (!this.isSelected && (!ignoreLinked || !isLinked))
			this.select();
	}

	select(): void {
		window.actions.setCurrentSoundboard(this.soundboard.uuid);
	}

	updateElements(): void {
		this.titleElement.innerHTML = this.soundboard.name;
		this.classList.remove("linked");
		if (this.soundboard.linkedFolder) this.classList.add("linked");
		this.descriptionElement.innerHTML = Keys.toKeyString(this.soundboard.keys);
		this.iconElement.innerHTML = this.soundboard.linkedFolder ? "link" : "";
	}

	setPlayingIndicatorState(state: boolean): void {
		if (state) {
			this.titleElement.style.fontWeight = "1000";
		} else {
			this.titleElement.style.fontWeight = "";
		}
	}

	// Handlers

	private handleSoundboardChanged = (sb: ISoundboardData): void => {
		if (sb.uuid === this.soundboard.uuid) {
			this.soundboard = sb;
			this.updateElements();
		}
	};

	private handlePlaying = (h: UuidHierarchyData): void => {
		if (h.includes(this.soundboard.uuid)) {
			this.setPlayingIndicatorState(true);
		}
	};

	private handleNotPlaying = (h: UuidHierarchyData): void => {
		if (h.includes(this.soundboard.uuid)) {
			this.setPlayingIndicatorState(false);
		}
	};

	private handleKeybindPressed = (keybind: number[]): void => {
		if (Keys.equals(keybind, this.soundboard.keys)) {
			window.actions.setCurrentSoundboard(this.soundboard.uuid);
		}
	};

	private handleAuxClick = (e: MouseEvent): void => {
		if (e.button === 1) {
			window.actions.stop(this.soundboard.uuid);
		}
	};

	private handleContextMenu = (): void => {
		void Actions.editSoundboard(this.soundboard.uuid);
	};

	private handleClick = (): void => {
		if (!this.isSelected) this.select();
	};

	private handleMouseMove = (): void => {
		const isLinked = this.soundboard.linkedFolder !== null;
		if (MSR.instance.draggableManager.currentGhost && !isLinked) {
			const d = MSR.instance.draggableManager.currentGhost;
			if (!(d instanceof PlayableItem)) return;
			if (!this.isSelected) this.select();
		}
	};

	private handleDragOver = (e: DragEvent): void => {
		e.preventDefault();
		this.safeSelect(true);
	};
}

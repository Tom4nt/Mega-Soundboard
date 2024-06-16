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
		this.init();
	}

	public destroy(): void {
		this.removeGlobalListeners();
		this.remove();
	}

	protected createGhost(): Draggable {
		const newItem = new SoundboardItem(this.soundboard);
		return newItem;
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

		this.addListeners();
		this.updateElements();
	}

	private addListeners(): void {
		this.addEventListener("auxclick", async (e) => {
			if (e.button === 1) {
				window.actions.stop(this.soundboard.uuid);
			}
		});

		this.addEventListener("contextmenu", async () => {
			await Actions.editSoundboard(this.soundboard.uuid);
		});

		this.addEventListener("click", () => {
			if (!this.isSelected) this.select();
		});

		// TODO: Change to drag update handler
		this.addEventListener("mousemove", async () => {
			const isLinked = this.soundboard.linkedFolder !== null;
			if (MSR.instance.draggableManager.currentGhost && !isLinked) {
				const d = MSR.instance.draggableManager.currentGhost;
				if (!(d instanceof PlayableItem)) return;
				// d.updateHint({
				// 	uuid: this.soundboard.uuid,
				// 	name: this.soundboard.name,
				// 	isLinked: this.soundboard.linkedFolder !== null,
				// });
				// d.canAddToNewLocation = this.soundboard.linkedFolder !== null;
				if (!this.isSelected) this.select();
			}
		});

		this.addEventListener("dragover", e => {
			e.preventDefault();
			this.safeSelect(true);
		});

		this.addGlobalListeners();
	}

	private safeSelect(ignoreLinked: boolean): void {
		const isLinked = this.soundboard.linkedFolder !== null;
		if (!this.isSelected && (!ignoreLinked || !isLinked))
			this.select();
	}

	private addGlobalListeners(): void {
		window.events.soundboardChanged.addHandler(this.handleSoundboardChanged);
		window.events.keybindPressed.addHandler(this.handleKeybindPressed);
		window.events.playing.addHandler(this.handlePlaying);
		window.events.notPlaying.addHandler(this.handleNotPlaying);
	}

	private removeGlobalListeners(): void {
		window.events.soundboardChanged.removeHandler(this.handleSoundboardChanged);
		window.events.keybindPressed.removeHandler(this.handleKeybindPressed);
		window.events.playing.removeHandler(this.handlePlaying);
		window.events.notPlaying.removeHandler(this.handleNotPlaying);
	}

	// eslint-disable-next-line class-methods-use-this
	protected get classDuringDrag(): string {
		return "drag";
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
}

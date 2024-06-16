import { ISoundboardData } from "../../shared/models/dataInterfaces";
import { SoundboardItem } from "../elements";
import MSR from "../msr";
import Utils from "../util/utils";

export default class SoundboardList extends HTMLElement {
	private _selectedItem: SoundboardItem | undefined;
	get selectedItem(): SoundboardItem | undefined { return this._selectedItem; }

	private dragElement: SoundboardItem | null = null;
	private dragDummy!: HTMLDivElement;

	private *getItems(): Generator<SoundboardItem> {
		for (let i = 0; i < this.childElementCount; i++) {
			const element = this.childNodes[i];
			if (element instanceof SoundboardItem) {
				yield element;
			}
		}
	}

	protected connectedCallback(): void {
		// Add drag dummy item
		const item = document.createElement("div");
		item.classList.add("item", "dragdummy");
		this.dragDummy = item;
		this.appendChild(item);

		window.events.currentSoundboardChanged.addHandler(sb => {
			this.selectSoundboard(sb);
		});

		window.events.soundboardRemoved.addHandler(sb => {
			const elem = this.getSoundboardElement(sb.uuid);
			elem?.destroy();
		});

		window.events.soundboardAdded.addHandler(args => {
			this.addSoundboard(args.soundboard, args.isCurrent, args.index);
		});

		MSR.instance.draggableManager.onDragUpdate.addHandler(args => {
			if (args.ghost instanceof SoundboardItem) {
				if (!this.dragElement) {
					this.showDragDummy();
					this.dragElement = args.ghost;
				}
				this.handleDragOver(args.pos.y);
			}
		});

		MSR.instance.draggableManager.onDragEnd.addHandler(() => {
			this.handleDrop();
			this.dragElement = null;
		});
	}

	addSoundboard(soundboard: ISoundboardData, isSelected: boolean, index?: number): void {
		const sbElement = new SoundboardItem(soundboard);
		sbElement.isSelected = isSelected;

		let beforeElement: HTMLElement | undefined = undefined;
		if (index !== undefined) {
			const items = Array.from(this.getItems());
			if (index >= 0 && index < items.length) beforeElement = items[index];
		}

		if (beforeElement) this.insertBefore(sbElement, beforeElement);
		else this.appendChild(sbElement);
	}

	selectSoundboard(sb: ISoundboardData): void {
		this.unselectAll();
		for (const item of this.getItems()) {
			if (item.soundboard.uuid === sb.uuid) {
				item.soundboard = sb;
				item.isSelected = true;
				this._selectedItem = item;
			}
		}
	}

	private unselectAll(): void {
		for (const item of this.getItems()) {
			item.isSelected = false;
		}
	}

	private hideDragDummy(): void {
		this.dragDummy.style.display = "";
	}

	private showDragDummy(): void {
		this.dragDummy.style.display = "inline-block";
	}

	/** Returns the element from the list representing a specific soundboard. Returns null if no element is found. */
	private getSoundboardElement(soundboardUuid: string): SoundboardItem | null {
		for (const item of this.getItems()) {
			if (item.soundboard.uuid === soundboardUuid) return item;
		}
		return null;
	}

	private getItemAtPosition(y: number, x?: number): SoundboardItem | undefined {
		const target = document.elementFromPoint(x ?? this.getBoundingClientRect().x, y);

		if (!target) return undefined;
		if (!(target instanceof SoundboardItem)) return undefined;

		return target;
	}

	private getItemIndex(item: SoundboardItem): number {
		let i = 0;
		for (const curr of this.getItems()) {
			if (curr === item) return i;
			i++;
		}
		return i;
	}

	// Handlers

	private handleDragOver = (yPos: number): void => {
		const target = this.getItemAtPosition(yPos);
		if (!target || !this.dragElement) return;

		if (Utils.getElementIndex(this.dragDummy) > Utils.getElementIndex(target)) {
			this.insertBefore(this.dragDummy, target);
		} else {
			this.insertBefore(this.dragDummy, target.nextElementSibling);
		}
	};

	private handleDrop = (): void => {
		if (!this.dragElement) return;

		// TODO: Drag ghost is not to be inserted.
		this.insertBefore(this.dragElement, this.dragDummy.nextElementSibling);
		const newIndex = this.getItemIndex(this.dragElement);
		window.actions.moveSoundboard(this.dragElement.soundboard.uuid, newIndex);

		this.hideDragDummy();
	};
}

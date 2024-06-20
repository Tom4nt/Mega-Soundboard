import { ISoundboardData } from "../../shared/models/dataInterfaces";
import { SoundboardItem } from "../elements";
import MSR from "../msr";
import Utils from "../util/utils";

export default class SoundboardList extends HTMLElement {
	private _loadedItems: SoundboardItem[] = [];
	private _selectedItem: SoundboardItem | undefined;
	get selectedItem(): SoundboardItem | undefined { return this._selectedItem; }

	private dragElement: SoundboardItem | null = null;
	private dragDummy!: HTMLDivElement;

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
			const elem = this._loadedItems.findIndex(x => x.soundboard.uuid === sb.uuid);
			if (elem < 0) return;
			this._loadedItems[elem]?.remove();
			this._loadedItems.splice(elem, 1);
		});

		window.events.soundboardAdded.addHandler(args => {
			this.addSoundboard(args.soundboard, args.isCurrent, args.index);
		});

		MSR.instance.draggableManager.onDragUpdate.addHandler(args => {
			if (args.ghost instanceof SoundboardItem) {
				if (!this.dragElement) {
					this.showDragDummy();
					const uuid = args.ghost.soundboard.uuid;
					this.dragElement = this._loadedItems.find(x => x.soundboard.uuid === uuid) ?? null;
					if (this.dragElement) this.dragElement.style.display = "none";
				}
				this.updateDragDummyPosition(args.pos.y);
			}
		});

		MSR.instance.draggableManager.onDragEnd.addHandler(() => {
			if (!this.dragElement) return;

			const newIndex = this.getDragDummyIndex();
			window.actions.moveSoundboard(this.dragElement.soundboard.uuid, newIndex);

			this.hideDragDummy();
			this.dragElement.style.display = "";
			this.dragElement = null;
		});
	}

	addSoundboard(soundboard: ISoundboardData, isSelected: boolean, index?: number): void {
		const sbElement = new SoundboardItem(soundboard);
		sbElement.isSelected = isSelected;

		let beforeElement: HTMLElement | undefined = undefined;
		if (index !== undefined && index >= 0 && index < this._loadedItems.length) {
			beforeElement = this._loadedItems[index];
		}

		if (beforeElement) {
			this.insertBefore(sbElement, beforeElement);
			this._loadedItems.splice(index!, 0, sbElement);
		}
		else {
			this.appendChild(sbElement);
			this._loadedItems.push(sbElement);
		}
	}

	selectSoundboard(sb: ISoundboardData): void {
		this.unselectAll();
		const item = this._loadedItems.find(x => x.soundboard.uuid === sb.uuid);
		if (item) {
			item.soundboard = sb;
			item.isSelected = true;
			this._selectedItem = item;
		}
	}

	private getDragDummyIndex(): number {
		return Utils.getElementIndex(this.dragDummy, (e) => e != this.dragElement);
	}

	private unselectAll(): void {
		for (const item of this._loadedItems) {
			item.isSelected = false;
		}
	}

	private hideDragDummy(): void {
		this.dragDummy.style.display = "";
	}

	private showDragDummy(): void {
		this.dragDummy.style.display = "block";
	}

	private getItemAtPosition(y: number, x?: number): SoundboardItem | undefined {
		const target = document.elementFromPoint(x ?? this.getBoundingClientRect().x, y);

		if (!target) return undefined;
		if (!(target instanceof SoundboardItem)) return undefined;

		return target;
	}

	private updateDragDummyPosition(yPos: number): void {
		const target = this.getItemAtPosition(yPos);
		if (!target || !this.dragElement) return;

		if (Utils.getElementIndex(this.dragDummy) > Utils.getElementIndex(target)) {
			this.insertBefore(this.dragDummy, target);
		} else {
			this.insertBefore(this.dragDummy, target.nextElementSibling);
		}
	}
}

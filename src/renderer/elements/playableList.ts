import { IPlayableArgs, Point } from "../../shared/interfaces";
import { Event, ExposedEvent } from "../../shared/events";
import { ISoundboardData } from "../../shared/models/dataInterfaces";
import MSR from "../msr";
import PlayableContainer from "./playableContainer";
import PlayableItem from "./playableItem";

const NO_SOUNDS = "This soundboard has no sounds";
const SEARCH_EMPTY = "No sounds with the current filter";

/**
 * Interfaces the soundboard with the root container.
 * Displays info about the current search.
 */
export default class PlayableList extends HTMLElement {
	private containerElement?: PlayableContainer;
	private currentFilter: string = "";
	private currentSoundboard?: ISoundboardData;
	private dragStartSoundboardUuid: string | null = null;

	private _onItemDragStart = new Event<void>();
	public get onItemDragStart(): ExposedEvent<void> { return this._onItemDragStart.expose(); }

	protected connectedCallback(): void {
		window.events.currentSoundboardChanged.addHandler(async sb => {
			const items = await window.actions.getContainerItems(sb.uuid);
			this.loadItems(items, sb);
		});

		MSR.instance.draggableManager.onDragStart.addHandler(e => {
			if (!(e.ghost instanceof PlayableItem) || !this.currentSoundboard) return;
			e.ghost.canRemoveFromCurrentLocation = this.currentSoundboard.linkedFolder === null;
			this.dragStartSoundboardUuid = this.currentSoundboard.uuid;
			this._onItemDragStart.raise();
		});
	}

	loadItems(playables: IPlayableArgs[], soundboard: ISoundboardData): void {
		this.currentSoundboard = soundboard;
		const container = this.getContainer(soundboard.uuid, this.currentFilter);
		container.allowFileImport = soundboard.linkedFolder === null;
		container.loadItems(playables);
	}

	sortItems(uuids: string[]): void {
		this.containerElement?.sort(uuids);
	}

	filter(filter: string): void {
		this.currentFilter = filter;
		if (this.containerElement) this.containerElement.filter = filter;
	}

	dragItem(pos: Point, item: PlayableItem): void {
		if (!this.currentSoundboard) return;
		item.canAddToNewLocation = this.currentSoundboard.linkedFolder === null;
		item.isMovingToNewLocation = this.currentSoundboard.uuid !== this.dragStartSoundboardUuid;
		item.newLocationName = this.currentSoundboard.name;
		this.containerElement?.dragItem(pos);
	}

	dragItemOutside(): void {
		this.containerElement?.dragItemOutside();
	}

	dropItem(item: PlayableItem): void {
		this.containerElement?.dropItem(item);
	}

	// ---

	private getContainer(soundboardUuid: string, filter: string): PlayableContainer {
		if (this.containerElement) this.containerElement.remove();

		const container = new PlayableContainer(soundboardUuid, () => this.getEmptyMessage());
		container.filter = filter;
		this.containerElement = container;
		this.append(container);

		return container;
	}

	private getEmptyMessage(): string {
		return this.containerElement?.filter ? SEARCH_EMPTY : NO_SOUNDS;
	}
}

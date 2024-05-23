import { Event, ExposedEvent } from "../../shared/events";
import { IPlayableData } from "../../shared/models/dataInterfaces";
import PlayableContainer from "./playableContainer";

const NO_SOUNDS = "This soundboard has no sounds";
const SEARCH_EMPTY = "No sounds with the current filter";

/**
 * Interfaces the soundboard with the root container.
 * Shows info about the current search.
 */
export default class PlayableList extends HTMLElement {
	private containerElement?: PlayableContainer;
	private currentFilter: string = "";

	private _onItemDragStart = new Event<IPlayableData>();
	public get onItemDragStart(): ExposedEvent<IPlayableData> { return this._onItemDragStart.expose(); }

	protected connectedCallback(): void {
		window.events.currentSoundboardChanged.addHandler(async sb => {
			const items = await window.actions.getContainerItems(sb.uuid);
			this.loadItems(items, sb.uuid, sb.linkedFolder === null);
		});
	}

	loadItems(playables: IPlayableData[], soundboardUuid: string, allowImport: boolean): void {
		const container = this.getContainer(soundboardUuid, this.currentFilter);
		container.allowFileImport = allowImport;
		container.loadItems(playables);
	}

	sortItems(uuids: string[]): void {
		this.containerElement?.sort(uuids);
	}

	filter(filter: string): void {
		this.currentFilter = filter;
		if (this.containerElement) this.containerElement.filter = filter;
	}

	// --- // ---

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

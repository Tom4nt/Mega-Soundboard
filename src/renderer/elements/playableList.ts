import { Event, ExposedEvent } from "../../shared/events";
import { IPlayableData } from "../../shared/models/dataInterfaces";
import Actions from "../util/actions";
import Utils from "../util/utils";
import PlayableContainer, { DroppedEventArgs } from "./playableContainer";

const NO_SOUNDS = "This soundboard has no sounds";
const SEARCH_EMPTY = "No sounds with the current filter";

export default class PlayableList extends HTMLElement {
	private currentSoundboardId?: string;
	private containerElement?: PlayableContainer;
	private currentFilter: string = "";

	private _onItemDragStart = new Event<IPlayableData>();
	public get onItemDragStart(): ExposedEvent<IPlayableData> { return this._onItemDragStart.expose(); }

	protected connectedCallback(): void {
		window.events.playableAdded.addHandler(e => {
			if (e.parentUuid === this.currentSoundboardId) {
				this.containerElement?.addItem(e.playable, e.index, e.isPlaying);
			} else {
				const targetContainer = this.containerElement?.getElementLocation(e.playable.uuid);
				targetContainer?.addItem(e.playable, undefined, e.isPlaying);
			}
		});

		window.events.playableRemoved.addHandler(s => {
			this.containerElement?.removeItem(s.uuid);
		});

		window.events.currentSoundboardChanged.addHandler(async sb => {
			const items = await window.actions.getContainerItems(sb.uuid);
			this.loadItems(items, sb.uuid, sb.linkedFolder === null);
		});

		window.events.containerSorted.addHandler(c => {
			if (this.currentSoundboardId === c.containerUuid) {
				this.sortItems(c.itemsUuids);
			}
		});
	}

	loadItems(playables: IPlayableData[], soundboardUuid: string, allowImport: boolean): void {
		this.currentSoundboardId = soundboardUuid;
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
		// TODO: Should not create a new container every time to be able to preserve item being dragged.
		if (this.containerElement) this.containerElement.remove();

		const container = new PlayableContainer(soundboardUuid, () => this.getEmptyMessage());
		container.filter = filter;
		this.containerElement = container;
		this.append(container);

		container.onFileDropped.addHandler(e => {
			void this.finishFileDrag(e.event, e.index);
		});
		container.onItemDropped.addHandler(this.handleItemDropped);
		return container;
	}

	private getEmptyMessage(): string {
		return this.containerElement?.filter ? SEARCH_EMPTY : NO_SOUNDS;
	}

	private async finishFileDrag(e: DragEvent, index: number): Promise<void> {
		const paths = await Utils.getValidSoundPaths(e);
		if (paths && this.currentSoundboardId)
			await Actions.addSounds(paths, this.currentSoundboardId, index);
	}

	// Handlers

	/** Item dropped on the container. */
	private handleItemDropped = async (e: DroppedEventArgs): Promise<void> => {
		const deepestContainer = e.containerPath.at(-1);
		const id = (deepestContainer) ?
			deepestContainer.parentUuid :
			this.currentSoundboardId;

		if (!id) return;

		const destinationUUID = e.item.draggingToNewSoundboard ? null : id;
		if (e.item.dragMode === "copy") {
			await window.actions.copyPlayable(e.item.playable.uuid, destinationUUID, e.index);
		} else {
			await window.actions.movePlayable(e.item.playable.uuid, destinationUUID, e.index);
		}
	};
}

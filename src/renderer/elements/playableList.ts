import { Event, ExposedEvent } from "../../shared/events";
import { Playable } from "../../shared/models/playable";
import Actions from "../util/actions";
import Utils from "../util/utils";
import PlayableContainer, { DroppedEventArgs } from "./playableContainer";

const NO_SOUNDS = "This soundboard has no sounds";
const SEARCH_EMPTY = "No sounds with the current filter";

export default class PlayableList extends HTMLElement {
    private currentSoundboardId?: string;
    private containerElement?: PlayableContainer;

    private _onItemDragStart = new Event<Playable>();
    public get onItemDragStart(): ExposedEvent<Playable> { return this._onItemDragStart.expose(); }

    protected connectedCallback(): void {
        window.events.onPlayableAdded.addHandler(e => {
            if (e.playable.parentUuid === this.currentSoundboardId) {
                this.containerElement?.addItem(e.playable, e.index);
            } else {
                const targetContainer = this.containerElement?.getElementLocation(e.playable.uuid);
                targetContainer?.addItem(e.playable);
            }
        });

        window.events.onPlayableRemoved.addHandler(s => {
            this.containerElement?.removeItem(s);
        });

        window.events.onCurrentSoundboardChanged.addHandler(sb => {
            this.loadItems(sb.playables, sb.uuid, sb.linkedFolder === null);
        });

        window.events.onContainerSorted.addHandler(c => {
            if (this.currentSoundboardId === c.uuid) {
                this.loadItems(c.playables, c.uuid, true);
            }
        });
    }

    loadItems(playables: Playable[], soundboardUuid: string, allowImport: boolean): void {
        this.currentSoundboardId = soundboardUuid;
        const container = this.createContainer(soundboardUuid);
        container.allowFileImport = allowImport;
        container.loadItems(playables);
    }

    filter(filter: string): void {
        if (this.containerElement) this.containerElement.filter = filter;
    }

    // --- // ---

    private createContainer(soundboardUuid: string): PlayableContainer {
        if (this.containerElement) this.containerElement.remove();

        const container = new PlayableContainer(soundboardUuid, () => this.getEmptyMessage());
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

        let destinationUUID = e.item.draggingToNewSoundboard ? null : id;
        if (e.item.dragMode === "copy") {
            destinationUUID = await window.actions.copyPlayable(e.item.playable.uuid, destinationUUID, e.index);
        } else {
            destinationUUID = await window.actions.movePlayable(e.item.playable.uuid, destinationUUID, e.index);
        }
        window.actions.setCurrentSoundboard(destinationUUID);
    };
}

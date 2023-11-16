import { Event, ExposedEvent } from "../../shared/events";
import { Playable } from "../../shared/models/playable";
import Actions from "../util/actions";
import GlobalEvents from "../util/globalEvents";
import Utils from "../util/utils";
import PlayableContainer, { DroppedEventArgs } from "./playableContainer";

const NO_SOUNDS = "This soundboard has no sounds";
const SEARCH_EMPTY = "No sounds with the current filter";

export default class PlayableList extends HTMLElement {
    private currentSoundboardId?: string;
    private containerElement!: PlayableContainer;

    private _onItemDragStart = new Event<Playable>();
    public get onItemDragStart(): ExposedEvent<Playable> { return this._onItemDragStart.expose(); }

    protected connectedCallback(): void {
        const container = new PlayableContainer(() => this.getEmptyMessage());
        this.containerElement = container;
        this.append(container);

        container.onFileDropped.addHandler(e => {
            void this.finishFileDrag(e.event, e.index);
        });

        container.onItemDropped.addHandler(this.handleItemDropped);

        GlobalEvents.addHandler("onPlayableAdded", e => {
            if (e.playable.parentUuid === this.currentSoundboardId) {
                container.addItem(e.playable, e.index);
            } else {
                const targetContainer = container.getElementLocation(e.playable.uuid);
                targetContainer?.addItem(e.playable);
            }
        });

        GlobalEvents.addHandler("onPlayableRemoved", s => {
            container.removeItem(s);
        });

        GlobalEvents.addHandler("onCurrentSoundboardChanged", sb => {
            this.loadItems(sb.playables, sb.uuid, sb.linkedFolder === null);
        });

        GlobalEvents.addHandler("onContainerSorted", c => {
            if (this.currentSoundboardId === c.uuid) {
                this.loadItems(c.playables, c.uuid, true);
            }
        });
    }

    loadItems(playables: Playable[], soundboardUuid: string, allowImport: boolean): void {
        this.currentSoundboardId = soundboardUuid;
        this.containerElement.allowFileImport = allowImport;
        this.containerElement.loadItems(playables);
    }

    filter(filter: string): void {
        this.containerElement.filter = filter;
    }

    // --- // ---

    private getEmptyMessage(): string {
        return this.containerElement.filter ? SEARCH_EMPTY : NO_SOUNDS;
    }

    private async finishFileDrag(e: DragEvent, index: number): Promise<void> {
        const paths = await Utils.getValidSoundPaths(e);
        if (paths && this.currentSoundboardId)
            await Actions.addSounds(paths, this.currentSoundboardId, index);
    }

    // Handlers

    /** Item dropped on the container. */
    private handleItemDropped = async (e: DroppedEventArgs): Promise<void> => {
        if (!this.currentSoundboardId) return;

        // TODO: Get correct destinationId (could be deep within a subContainer).
        let destinationUUID = e.item.draggingToNewSoundboard ? null : this.currentSoundboardId;
        if (e.item.dragMode === "copy") {
            destinationUUID = await window.actions.copyPlayable(e.item.playable.uuid, destinationUUID, e.index);
        } else {
            destinationUUID = await window.actions.movePlayable(e.item.playable.uuid, destinationUUID, e.index);
        }
        window.actions.setCurrentSoundboard(destinationUUID);
    };
}

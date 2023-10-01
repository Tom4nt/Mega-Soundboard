import { Event, ExposedEvent } from "../../shared/events";
import { Sound } from "../../shared/models";
import { SoundContainer } from "../elements";
import Actions from "../util/actions";
import GlobalEvents from "../util/globalEvents";
import Utils from "../util/utils";
import { SoundDroppedEventArgs } from "./soundContainer";

const NO_SOUNDS = "This soundboard has no sounds";
const SEARCH_EMPTY = "No sounds with the current filter";

export default class SoundList extends HTMLElement {
    private currentSoundboardId?: string;
    private containerElement!: SoundContainer;

    private _onSoundDragStart = new Event<Sound>();
    public get onSoundDragStart(): ExposedEvent<Sound> { return this._onSoundDragStart.expose(); }

    protected connectedCallback(): void {
        const container = new SoundContainer(() => this.getEmptyMessage());
        this.containerElement = container;
        this.append(container);

        container.onFileDropped.addHandler(e => {
            void this.finishFileDrag(e.event, e.index);
        });

        container.onSoundDropped.addHandler(this.handleSoundDropped);

        GlobalEvents.addHandler("onSoundAdded", e => {
            if (e.sound.soundboardUuid === this.currentSoundboardId)
                container.addSound(e.sound, e.index);
        });

        GlobalEvents.addHandler("onSoundRemoved", s => {
            container.removeSound(s);
        });

        GlobalEvents.addHandler("onCurrentSoundboardChanged", sb => {
            this.loadSounds(sb.sounds, sb.uuid, sb.linkedFolder === null);
        });

        GlobalEvents.addHandler("onSoundboardSoundsSorted", sb => {
            if (this.currentSoundboardId === sb.uuid) {
                this.loadSounds(sb.sounds, sb.uuid, true);
            }
        });
    }

    loadSounds(sounds: Sound[], soundboardUuid: string, allowImport: boolean): void {
        this.currentSoundboardId = soundboardUuid;
        this.containerElement.allowFileImport = allowImport;
        this.containerElement.loadSounds(sounds);
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

    private handleSoundDropped = (e: SoundDroppedEventArgs): void => {
        if (!this.currentSoundboardId) return;

        // This will reload the list since it is listening to the onSoundboardChanged global event.
        const destinationUUID = e.item.draggingToNewSoundboard ? null : this.currentSoundboardId;
        if (e.item.dragMode === "copy") {
            void window.actions.copySound(e.item.sound.uuid, destinationUUID, e.index);
        } else {
            void window.actions.moveSound(e.item.sound.uuid, destinationUUID, e.index);
        }
    };
}

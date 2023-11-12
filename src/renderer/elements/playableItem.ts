import Keys from "../../shared/keys";
import { UISoundPath } from "../models";
import { MessageModal } from "../modals";
import MSR from "../msr";
import Draggable from "./draggable";
import Utils from "../util/utils";
import Actions from "../util/actions";
import GlobalEvents from "../util/globalEvents";
import KeyStateListener from "../util/keyStateListener";
import { Event, ExposedEvent } from "../../shared/events";
import { Playable, equals } from "../../shared/models/playable";
import { isSound } from "../../shared/models/sound";
import { isGroup } from "../../shared/models/group";
import { findInContainer } from "../../shared/models/container";

type SimpleSoundboard = { uuid: string, name: string, isLinked: boolean };
type DragSession = { sourceSoundboard: SimpleSoundboard, targetSoundboard: SimpleSoundboard | null };

export default class PlayableItem extends Draggable {
    private titleElement!: HTMLSpanElement;
    private detailsElement!: HTMLSpanElement;
    private indicatorElement!: HTMLDivElement;
    private currentKeyStateListener: KeyStateListener | null = null;
    private _draggingToNewSoundboard = false;
    private playingSoundCount = 0;
    private currentDragSession: DragSession | null = null;

    public get draggingToNewSoundboard(): boolean { return this._draggingToNewSoundboard; }
    public set draggingToNewSoundboard(v: boolean) {
        this._draggingToNewSoundboard = v;
        if (this.currentDragSession)
            void this.updateHint(undefined);
    }

    private _expandRequested = new Event<PlayableItem>();
    public get onExpandRequested(): ExposedEvent<PlayableItem> { return this._expandRequested.expose(); }

    // eslint-disable-next-line class-methods-use-this
    protected get classDuringDrag(): string {
        return "drag";
    }

    constructor(public playable: Playable) {
        super();
        this.init();
    }

    public updatePlayingIndicator(difference: number): void {
        this.playingSoundCount += difference;
        if (this.playingSoundCount < 0) this.playingSoundCount = 0; // Not supposed to happen
        this.setPlayingState(this.playingSoundCount > 0);
    }

    public setPlayingState(playingState: boolean): void {
        if (playingState) {
            this.indicatorElement.style.top = "-11px";
            this.indicatorElement.style.right = "-11px";
        } else {
            this.indicatorElement.style.top = "";
            this.indicatorElement.style.right = "";
        }
    }

    public updateHint(targetSb?: SimpleSoundboard): void {
        if (!this.currentDragSession) return;
        if (targetSb) this.currentDragSession.targetSoundboard = targetSb;
        const targetSB = this.currentDragSession.targetSoundboard;
        const sourceSB = this.currentDragSession.sourceSoundboard;
        const isSameSB = targetSB?.uuid === sourceSB.uuid && !this.draggingToNewSoundboard;
        let sbName = isSameSB ? "" : targetSB?.name ?? "";
        if (this.draggingToNewSoundboard) sbName = "new soundboard";
        const copies = this.getHintMode(
            this.currentKeyStateListener?.isCtrlPressed ?? false, isSameSB, this.currentDragSession.sourceSoundboard.isLinked
        );
        const prefix = sbName ?
            (copies ? "Copy to " : "Move to ") :
            (copies ? "Copy" : "");
        super.setDragHint(prefix + sbName, copies ? "copy" : "move");
    }

    public update(): void {
        this.titleElement.innerHTML = this.playable.name;
        this.detailsElement.innerHTML = Keys.toKeyString(this.playable.keys);
    }

    public destroy(): void {
        this.removeGlobalListeners();
        this.remove();
    }

    public clone(): PlayableItem {
        const newItem = new PlayableItem(this.playable);
        return newItem;
    }

    private init(): void {
        this.classList.add("item");

        const left = document.createElement("div");
        left.style.minWidth = "0";
        left.style.padding = "8px";
        left.style.flexGrow = "1";

        const right = document.createElement("div");
        right.style.padding = "14px";
        right.style.alignSelf = "stretch";

        this.titleElement = document.createElement("span");
        this.titleElement.style.pointerEvents = "none";

        this.detailsElement = document.createElement("span");
        this.detailsElement.classList.add("desc");
        this.detailsElement.style.pointerEvents = "none";

        this.indicatorElement = document.createElement("div");
        this.indicatorElement.classList.add("indicator");

        const expandIcon = document.createElement("i");
        expandIcon.style.fontSize = "24px";
        expandIcon.innerText = "view_list";

        this.update();
        left.append(this.titleElement, this.detailsElement);
        right.append(expandIcon);

        const items: Node[] = [
            left, ...isGroup(this.playable) ? [right] : [], this.indicatorElement
        ];
        this.append(...items);

        const handleClick = async (e: MouseEvent): Promise<void> => {
            if (e.target === this.indicatorElement) return;
            try {
                await MSR.instance.audioManager.play(this.playable);
            } catch (error) {
                new MessageModal("Could not play", Utils.getErrorMessage(error), true).open();
                await MSR.instance.audioManager.playUISound(UISoundPath.ERROR);
            }
        };

        left.addEventListener("click", e => void handleClick(e));
        right.addEventListener("click", () => this._expandRequested.raise(this));

        this.addEventListener("auxclick", e => {
            if (e.button === 1) {
                MSR.instance.audioManager.stop(this.playable.uuid);
            }
        });

        this.addEventListener("contextmenu", () => {
            void Actions.editPlayable(this.playable);
        });

        this.indicatorElement.addEventListener("click", () => {
            MSR.instance.audioManager.stop(this.playable.uuid);
        });

        this.onDragStart.addHandler(async (c) => {
            const sb = await window.actions.getPlayableRoot(this.playable.uuid);
            if (!sb) {
                c.cancel = true;
                return;
            }
            const simpleSb: SimpleSoundboard = { name: sb.name, isLinked: sb.linkedFolder != null, uuid: sb.uuid };
            this.currentDragSession = { sourceSoundboard: simpleSb, targetSoundboard: null };
            this.currentKeyStateListener = new KeyStateListener();
            this.currentKeyStateListener.onStateChanged.addHandler(async () => {
                this.updateHint(undefined);
            });
        });

        this.onDragEnd.addHandler(() => {
            this.currentKeyStateListener?.finish();
            this.currentKeyStateListener = null;
        });

        this.addGlobalListeners();
    }

    private addGlobalListeners(): void {
        MSR.instance.audioManager.onPlay.addHandler(this.handlePlay);
        MSR.instance.audioManager.onStop.addHandler(this.handleStop);
        GlobalEvents.addHandler("onPlayableChanged", this.handlePlayableChanged);
        GlobalEvents.addHandler("onKeybindPressed", this.handleKeybindPressed);
    }

    private removeGlobalListeners(): void {
        MSR.instance.audioManager.onPlay.removeHandler(this.handlePlay);
        MSR.instance.audioManager.onStop.removeHandler(this.handleStop);
        GlobalEvents.removeHandler("onPlayableChanged", this.handlePlayableChanged);
        GlobalEvents.removeHandler("onKeybindPressed", this.handleKeybindPressed);
    }

    private getHintMode(wantsCopy: boolean, isSameSoundboard: boolean, isLinkedSoundboard: boolean): boolean {
        let copies = wantsCopy;
        if (isLinkedSoundboard) copies = !isSameSoundboard;
        this.dragMode = copies ? "copy" : "move";
        return copies;
    }

    private containsPlayable(uuid: string): boolean {
        return isGroup(this.playable) && findInContainer(this.playable, uuid) != undefined;
    }

    // Handlers

    private handlePlay = (playable: Playable): void => {
        if (equals(playable, this.playable) || this.containsPlayable(playable.uuid))
            this.updatePlayingIndicator(1);
    };

    private handleStop = (id: string): void => {
        if (id == this.playable.uuid || this.containsPlayable(id))
            this.updatePlayingIndicator(-1);
    };

    private handlePlayableChanged = (playable: Playable): void => {
        if (equals(playable, this.playable) && isSound(playable)) {
            this.playable = playable;
            this.update();
        }
    };

    private handleKeybindPressed = async (keys: number[]): Promise<void> => {
        if (Keys.equals(keys, this.playable.keys)) {
            try {
                await MSR.instance.audioManager.play(this.playable);
            } catch (error) {
                await MSR.instance.audioManager.playUISound(UISoundPath.ERROR);
            }
        }
    };
}

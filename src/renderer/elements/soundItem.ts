import Keys from "../../shared/keys";
import { UISoundPath } from "../models";
import { Sound } from "../../shared/models";
import { MessageModal } from "../modals";
import MSR from "../msr";
import Draggable from "./draggable";
import Utils from "../util/utils";
import Actions from "../util/actions";
import { SoundChangedArgs } from "../../shared/interfaces";
import GlobalEvents from "../util/globalEvents";
import KeyStateListener from "../util/keyStateListener";
import { Event, ExposedEvent } from "../../shared/events";

type SimpleSoundboard = { uuid: string, name: string, isLinked: boolean };

export default class SoundItem extends Draggable {
    private titleElement!: HTMLSpanElement;
    private detailsElement!: HTMLSpanElement;
    private indicatorElement!: HTMLDivElement;
    private currentKeyStateListener: KeyStateListener | null = null;
    private _draggingToNewSoundboard = false;
    private currentHintSoundboard: SimpleSoundboard | null = null;

    public get draggingToNewSoundboard(): boolean { return this._draggingToNewSoundboard; }
    public set draggingToNewSoundboard(v: boolean) {
        this._draggingToNewSoundboard = v;
        void this.updateHint(undefined);
    }

    private _expandRequested = new Event<SoundItem>();
    public get onExpandRequested(): ExposedEvent<SoundItem> { return this._expandRequested.expose(); }

    // eslint-disable-next-line class-methods-use-this
    protected get classDuringDrag(): string {
        return "drag";
    }

    constructor(public sound: Sound) {
        super();
        this.init();
    }

    public updatePlayingState(): void {
        const isPlaying = MSR.instance.audioManager.isSoundPlaying(this.sound.uuid);
        this.setPlayingState(isPlaying);
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

    public async updateHint(soundboard?: SimpleSoundboard): Promise<void> {
        if (soundboard) this.currentHintSoundboard = soundboard;
        const sb = this.currentHintSoundboard;
        const isSameSB = sb?.uuid === this.sound.soundboardUuid && !this.draggingToNewSoundboard;
        let sbName = isSameSB ? "" : sb?.name ?? "";
        if (this.draggingToNewSoundboard) sbName = "new soundboard";
        const copies = await this.getHintMode(
            this.currentKeyStateListener?.isCtrlPressed ?? false, isSameSB);
        const prefix = sbName ?
            (copies ? "Copy to " : "Move to ") :
            (copies ? "Copy" : "");
        super.setDragHint(prefix + sbName, copies ? "copy" : "move");
    }

    public update(): void {
        this.titleElement.innerHTML = this.sound.name;
        this.detailsElement.innerHTML = Keys.toKeyString(this.sound.keys);
        this.updatePlayingState();
    }

    public destroy(): void {
        this.removeGlobalListeners();
        this.remove();
    }

    public clone(): SoundItem {
        const newItem = new SoundItem(this.sound);
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
        this.append(left, right, this.indicatorElement);

        const handleSoundClick = async (e: MouseEvent): Promise<void> => {
            if (e.target === this.indicatorElement) return;
            try {
                await MSR.instance.audioManager.playSound(this.sound);
            } catch (error) {
                new MessageModal("Could not play", Utils.getErrorMessage(error), true).open();
                await MSR.instance.audioManager.playUISound(UISoundPath.ERROR);
            }
        };

        left.addEventListener("click", e => void handleSoundClick(e));
        right.addEventListener("click", () => this._expandRequested.raise(this));

        this.addEventListener("auxclick", e => {
            if (e.button === 1) {
                MSR.instance.audioManager.stopSound(this.sound.uuid);
            }
        });

        this.addEventListener("contextmenu", () => {
            Actions.editSound(this.sound);
        });

        this.indicatorElement.addEventListener("click", () => {
            MSR.instance.audioManager.stopSound(this.sound.uuid);
        });

        this.onDragStart.addHandler(() => {
            this.currentKeyStateListener = new KeyStateListener();
            this.currentKeyStateListener.onStateChanged.addHandler(async () => {
                await this.updateHint(undefined);
            });
        });

        this.onDragEnd.addHandler(() => {
            this.currentKeyStateListener?.finish();
            this.currentKeyStateListener = null;
        });

        this.addGlobalListeners();
    }

    private addGlobalListeners(): void {
        MSR.instance.audioManager.onPlaySound.addHandler(this.handlePlaySound);
        MSR.instance.audioManager.onStopSound.addHandler(this.handleStopSound);
        GlobalEvents.addHandler("onSoundChanged", this.handleSoundChanged);
        GlobalEvents.addHandler("onKeybindPressed", this.handleKeybindPressed);
    }

    private removeGlobalListeners(): void {
        MSR.instance.audioManager.onPlaySound.removeHandler(this.handlePlaySound);
        MSR.instance.audioManager.onStopSound.removeHandler(this.handleStopSound);
        GlobalEvents.removeHandler("onSoundChanged", this.handleSoundChanged);
        GlobalEvents.removeHandler("onKeybindPressed", this.handleKeybindPressed);
    }

    private async getHintMode(wantsCopy: boolean, sameSoundboard: boolean): Promise<boolean> {
        if (!this.sound.soundboardUuid) return false;
        let copies = wantsCopy;
        const sb = await window.actions.getSoundboard(this.sound.soundboardUuid);
        if (sb.linkedFolder !== null) copies = !sameSoundboard;
        this.dragMode = copies ? "copy" : "move";
        return copies;
    }

    // Handlers

    private handlePlaySound = (sound: Sound): void => {
        if (Sound.equals(sound, this.sound))
            this.updatePlayingState();
    };

    private handleStopSound = (soundUuid: string): void => {
        if (soundUuid == this.sound.uuid)
            this.updatePlayingState();
    };

    private handleSoundChanged = (e: SoundChangedArgs): void => {
        if (Sound.equals(e.sound, this.sound)) {
            this.sound = e.sound;
            this.update();
        }
    };

    private handleKeybindPressed = async (keys: number[]): Promise<void> => {
        if (Keys.equals(keys, this.sound.keys)) {
            try {
                await MSR.instance.audioManager.playSound(this.sound);
            } catch (error) {
                await MSR.instance.audioManager.playUISound(UISoundPath.ERROR);
            }
        }
    };
}

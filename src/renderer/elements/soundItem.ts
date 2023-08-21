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

type SimpleSoundboard = { uuid: string, name: string };

export default class SoundItem extends Draggable {
    private titleElement!: HTMLSpanElement;
    private detailsElement!: HTMLSpanElement;
    private indicatorElement!: HTMLDivElement;
    private currentHintSoundboard: SimpleSoundboard | null = null;
    private currentHintMode: "move" | "add" = "move";
    private currentKeyStateListener: KeyStateListener | null = null;

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

    public setHintSoundboard(soundboard: SimpleSoundboard): void {
        this.currentHintSoundboard = soundboard;
        this.updateDragHint();
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

    private init(): void {
        this.classList.add("item");

        this.titleElement = document.createElement("span");
        this.titleElement.style.pointerEvents = "none";

        this.detailsElement = document.createElement("span");
        this.detailsElement.classList.add("desc");
        this.detailsElement.style.pointerEvents = "none";

        const playingIndicator = document.createElement("div");
        playingIndicator.classList.add("indicator");
        this.indicatorElement = playingIndicator;

        this.update();
        this.append(this.titleElement, this.detailsElement, playingIndicator);

        const handleSoundClick = async (e: MouseEvent): Promise<void> => {
            if (e.target === playingIndicator) return;
            try {
                await MSR.instance.audioManager.playSound(this.sound);
            } catch (error) {
                new MessageModal("Could not play", Utils.getErrorMessage(error), true).open();
                await MSR.instance.audioManager.playUISound(UISoundPath.ERROR);
            }
        };

        this.addEventListener("click", e => void handleSoundClick(e));

        this.addEventListener("auxclick", e => {
            if (e.button === 1) {
                MSR.instance.audioManager.stopSound(this.sound.uuid);
            }
        });

        this.addEventListener("contextmenu", () => {
            Actions.editSound(this.sound);
        });

        playingIndicator.addEventListener("click", () => {
            MSR.instance.audioManager.stopSound(this.sound.uuid);
        });

        this.onDragStart.addHandler(() => {
            this.currentKeyStateListener = new KeyStateListener();
            this.currentKeyStateListener.onStateChanged.addHandler(s => {
                this.currentHintMode = s.isCtrlPressed ? "add" : "move";
                this.updateDragHint();
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

    private updateDragHint(): void {
        const sb = this.currentHintSoundboard;
        const isSameSB = sb?.uuid === this.sound.soundboardUuid;
        const sbName = isSameSB ? "" : sb?.name ?? "";
        const prefix = sbName ?
            (this.currentHintMode === "add" ? "Copy to " : "Move to ") :
            (this.currentHintMode === "add" ? "Copy" : "");
        super.setDragHint(prefix + sbName, this.currentHintMode);
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

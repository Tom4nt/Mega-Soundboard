import Keys from "../../shared/keys";
import { UISoundPath } from "../models";
import { Sound } from "../../shared/models";
import { MessageModal } from "../modals";
import MSR from "../msr";
import Draggable from "./draggable";
import Utils from "../util/utils";
import Actions from "../util/actions";

export default class SoundItem extends Draggable {
    private titleElement!: HTMLSpanElement;
    private detailsElement!: HTMLSpanElement;
    private indicatorElement!: HTMLDivElement;

    // eslint-disable-next-line class-methods-use-this
    protected get classDuringDrag(): string {
        return "drag";
    }

    constructor(public readonly sound: Sound) {
        super();
    }

    protected connectedCallback(): void {
        this.classList.add("item");

        this.titleElement = document.createElement("span");
        this.titleElement.style.pointerEvents = "none";

        this.detailsElement = document.createElement("span");
        this.detailsElement.classList.add("desc");
        this.detailsElement.style.pointerEvents = "none";

        const playingIndicator = document.createElement("div");
        playingIndicator.classList.add("indicator");

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

        this.addGlobalListeners();
    }

    setPlayingState(playingState: boolean): void {
        if (playingState) {
            this.indicatorElement.style.top = "-11px";
            this.indicatorElement.style.right = "-11px";
        } else {
            this.indicatorElement.style.top = "";
            this.indicatorElement.style.right = "";
        }
    }

    update(): void {
        this.titleElement.innerHTML = this.sound.name;
        this.detailsElement.innerHTML = Keys.toKeyString(this.sound.keys);
    }

    private addGlobalListeners(): void {
        MSR.instance.audioManager.onPlaySound.addHandler(sound => {
            if (sound.equals(this.sound))
                this.setPlayingState(true);
        });

        MSR.instance.audioManager.onStopSound.addHandler(uuid => {
            if (uuid == this.sound.uuid)
                this.setPlayingState(false);
        });
    }
}

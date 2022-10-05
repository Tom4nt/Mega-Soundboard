import Keys from "../../shared/keys";
import { Soundboard } from "../../shared/models";
import MSR from "../msr";
import Actions from "../util/actions";
import TooltipWrapper from "../util/tooltipWrapper";
import Draggable from "./draggable";

export default class SoundboardItem extends Draggable {
    private indicatorElement!: HTMLDivElement;
    private titleElement!: HTMLSpanElement;
    private descriptionElement!: HTMLSpanElement;

    private playingSoundCount = 0;

    get isSelected(): boolean {
        return this.classList.contains("selected");
    }
    set isSelected(v: boolean) {
        if (v) this.classList.add("selected");
        else this.classList.remove("selected");
    }

    constructor(public readonly soundboard: Soundboard) {
        super();
    }

    protected connectedCallback(): void {
        this.classList.add("item");

        const indicator = document.createElement("div");
        indicator.classList.add("indicator");
        this.indicatorElement = indicator;

        const title = document.createElement("span");
        title.classList.add("title");
        this.titleElement = title;

        const desc = document.createElement("span");
        desc.classList.add("desc");
        this.descriptionElement = desc;

        const icon = document.createElement("span");
        if (this.soundboard.linkedFolder) icon.innerHTML = "link";
        icon.classList.add("icon");

        const tt = new TooltipWrapper(icon);
        tt.tooltip.tooltipText = "This soundboard is linked to a folder";

        this.append(indicator, title, desc, icon);

        this.addListeners();
        this.updateElements();
    }

    private addListeners(): void {
        this.addEventListener("auxclick", (e) => {
            if (e.button === 1) {
                MSR.instance.audioManager.stopSounds(this.soundboard.sounds.map(x => x.uuid));
            }
        });

        this.addEventListener("contextmenu", () => {
            Actions.editSoundboard(this.soundboard);
        });
    }

    // eslint-disable-next-line class-methods-use-this
    protected get classDuringDrag(): string {
        return "drag";
    }

    updateElements(): void {
        this.titleElement.innerHTML = this.soundboard.name;
        this.classList.remove("linked");
        if (this.soundboard.linkedFolder) this.classList.add("linked");
        this.descriptionElement.innerHTML = Keys.toKeyString(this.soundboard.keys);
        this.indicatorElement.innerHTML = this.soundboard.linkedFolder ? "link" : "";
    }

    updatePlayingIndicator(playingSoundCountSum: number): void {
        if (this.playingSoundCount) this.playingSoundCount += playingSoundCountSum;
        else this.playingSoundCount = playingSoundCountSum;

        if (this.playingSoundCount < 0) this.playingSoundCount = 0; // Not supposed to happen

        this.setPlayingIndicatorState(this.playingSoundCount > 0);
    }

    setPlayingIndicatorState(state: boolean): void {
        if (state) {
            this.titleElement.style.fontWeight = "1000";
        } else {
            this.titleElement.style.fontWeight = "";
        }
    }
}

customElements.define("ms-soundboard", SoundboardItem);
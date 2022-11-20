import Keys from "../../shared/keys";
import { Soundboard } from "../../shared/models";
import { Tooltip } from "../elements";
import MSR from "../msr";
import Actions from "../util/actions";
import Draggable from "./draggable";

export default class SoundboardItem extends Draggable {
    private iconElement!: HTMLSpanElement;
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

    constructor(public soundboard: Soundboard) {
        super();
        this.lockHorizontal = true;
        this.init();
    }

    private init(): void {
        this.classList.add("item");

        const indicator = document.createElement("div");
        indicator.classList.add("indicator");

        const title = document.createElement("span");
        title.classList.add("title");
        this.titleElement = title;

        const desc = document.createElement("span");
        desc.classList.add("desc");
        this.descriptionElement = desc;

        const icon = document.createElement("span");
        this.iconElement = icon;
        if (this.soundboard.linkedFolder) icon.innerHTML = "link";
        icon.classList.add("icon");

        const tt = new Tooltip();
        tt.tooltipText = "This soundboard is linked to a folder";
        tt.attatch(icon);

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

        this.addEventListener("click", () => {
            if (!this.isSelected) this.select();
        });

        window.events.onSoundboardChanged.addHandler(sb => {
            if (Soundboard.equals(sb, this.soundboard)) {
                this.soundboard = sb;
                this.updateElements();
            }
        });

        MSR.instance.audioManager.onPlaySound.addHandler(s => {
            if (!s.soundboard) return;
            if (Soundboard.equals(this.soundboard, s.soundboard)) {
                this.updatePlayingIndicator(1);
            }
        });

        MSR.instance.audioManager.onStopSound.addHandler(s => {
            const sound = this.soundboard.sounds.find(x => x.uuid = s);
            if (!sound) return;
            this.updatePlayingIndicator(-1);
        });
    }

    // eslint-disable-next-line class-methods-use-this
    protected get classDuringDrag(): string {
        return "drag";
    }

    select(): void {
        window.actions.setCurrentSoundboard(this.soundboard.uuid);
    }

    updateElements(): void {
        this.titleElement.innerHTML = this.soundboard.name;
        this.classList.remove("linked");
        if (this.soundboard.linkedFolder) this.classList.add("linked");
        this.descriptionElement.innerHTML = Keys.toKeyString(this.soundboard.keys);
        this.iconElement.innerHTML = this.soundboard.linkedFolder ? "link" : "";
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

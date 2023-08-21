import Keys from "../../shared/keys";
import { Sound, Soundboard } from "../../shared/models";
import { SoundItem, Tooltip } from "../elements";
import MSR from "../msr";
import Actions from "../util/actions";
import GlobalEvents from "../util/globalEvents";
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

    destroy(): void {
        this.removeGlobalListeners();
        this.remove();
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
        tt.attach(icon);

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

        this.addEventListener("contextmenu", async () => {
            await Actions.editSoundboard(this.soundboard);
        });

        this.addEventListener("click", () => {
            if (!this.isSelected) this.select();
        });

        this.addEventListener("mousemove", () => {
            // TODO: Test
            const isLinked = this.soundboard.linkedFolder !== null;
            if (Draggable.currentElement && !isLinked) {
                const d = Draggable.currentElement;
                if (!(d instanceof SoundItem)) return;
                d.setHintSoundboard({ uuid: this.soundboard.uuid, name: this.soundboard.name });
                this.safeSelect(true);
            }
        });

        this.addEventListener("dragover", e => {
            e.preventDefault();
            this.safeSelect(true);
        });

        this.addGlobalListeners();
    }

    private safeSelect(ignoreLinked: boolean): void {
        const isLinked = this.soundboard.linkedFolder !== null;
        if (!this.isSelected && (!ignoreLinked || !isLinked))
            this.select();
    }

    private addGlobalListeners(): void {
        GlobalEvents.addHandler("onSoundboardChanged", this.handleSoundboardChanged);
        GlobalEvents.addHandler("onKeybindPressed", this.handleKeybindPressed);
        MSR.instance.audioManager.onPlaySound.addHandler(this.handlePlaySound);
        MSR.instance.audioManager.onStopSound.addHandler(this.handleStopSound);
    }

    private removeGlobalListeners(): void {
        GlobalEvents.removeHandler("onSoundboardChanged", this.handleSoundboardChanged);
        GlobalEvents.removeHandler("onKeybindPressed", this.handleKeybindPressed);
        MSR.instance.audioManager.onPlaySound.removeHandler(this.handlePlaySound);
        MSR.instance.audioManager.onStopSound.removeHandler(this.handleStopSound);
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

    // Handlers

    private handleSoundboardChanged = (sb: Soundboard): void => {
        if (Soundboard.equals(sb, this.soundboard)) {
            this.soundboard = sb;
            this.updateElements();
        }
    };

    private handlePlaySound = (s: Sound): void => {
        if (!s.soundboardUuid) return;
        if (this.soundboard.uuid === s.soundboardUuid) {
            this.updatePlayingIndicator(1);
        }
    };

    private handleStopSound = (uuid: string): void => {
        const sound = this.soundboard.sounds.find(x => x.uuid == uuid);
        if (!sound) return;
        this.updatePlayingIndicator(-1);
    };

    private handleKeybindPressed = (keybind: number[]): void => {
        if (Keys.equals(keybind, this.soundboard.keys)) {
            window.actions.setCurrentSoundboard(this.soundboard.uuid);
        }
    };
}

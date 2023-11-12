import { PlayableAddedArgs } from "../../shared/interfaces";
import Keys from "../../shared/keys";
import { findInContainer } from "../../shared/models/container";
import { Playable, equals } from "../../shared/models/playable";
import { Soundboard, soundboardEquals } from "../../shared/models/soundboard";
import { PlayableItem, Tooltip } from "../elements";
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

    public destroy(): void {
        this.removeGlobalListeners();
        this.remove();
    }

    protected clone(): Draggable {
        const newItem = new SoundboardItem(this.soundboard);
        return newItem;
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

        const icon = document.createElement("i");
        this.iconElement = icon;
        if (this.soundboard.linkedFolder) icon.innerHTML = "link";

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
                MSR.instance.audioManager.stopMultiple(this.soundboard.playables.map(x => x.uuid));
            }
        });

        this.addEventListener("contextmenu", async () => {
            await Actions.editSoundboard(this.soundboard);
        });

        this.addEventListener("click", () => {
            if (!this.isSelected) this.select();
        });

        this.addEventListener("mousemove", async () => {
            const isLinked = this.soundboard.linkedFolder !== null;
            if (Draggable.currentElement && !isLinked) {
                const d = Draggable.currentElement;
                if (!(d instanceof PlayableItem)) return;
                d.updateHint({
                    uuid: this.soundboard.uuid,
                    name: this.soundboard.name,
                    isLinked: this.soundboard.linkedFolder !== null,
                });
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
        GlobalEvents.addHandler("onPlayableAdded", this.handlePlayableAdded);
        GlobalEvents.addHandler("onPlayableRemoved", this.handlePlayableRemoved);
        MSR.instance.audioManager.onPlay.addHandler(this.handlePlay);
        MSR.instance.audioManager.onStop.addHandler(this.handleStop);
    }

    private removeGlobalListeners(): void {
        GlobalEvents.removeHandler("onSoundboardChanged", this.handleSoundboardChanged);
        GlobalEvents.removeHandler("onKeybindPressed", this.handleKeybindPressed);
        GlobalEvents.removeHandler("onPlayableAdded", this.handlePlayableAdded);
        GlobalEvents.removeHandler("onPlayableRemoved", this.handlePlayableRemoved);
        MSR.instance.audioManager.onPlay.removeHandler(this.handlePlay);
        MSR.instance.audioManager.onStop.removeHandler(this.handleStop);
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
        this.playingSoundCount += playingSoundCountSum;
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
        if (soundboardEquals(sb, this.soundboard)) {
            this.soundboard = sb;
            this.updateElements();
        }
    };

    private handlePlay = (p: Playable): void => {
        if (findInContainer(this.soundboard, p.uuid)) {
            this.updatePlayingIndicator(1);
        }
    };

    private handleStop = (uuid: string): void => {
        if (findInContainer(this.soundboard, uuid)) {
            this.updatePlayingIndicator(-1);
        }
    };

    private handleKeybindPressed = (keybind: number[]): void => {
        if (Keys.equals(keybind, this.soundboard.keys)) {
            window.actions.setCurrentSoundboard(this.soundboard.uuid);
        }
    };

    private handlePlayableAdded = (e: PlayableAddedArgs): void => {
        this.soundboard.playables.splice(e.index ?? 0, 0, e.playable);
    };

    private handlePlayableRemoved = (p: Playable): void => {
        const index = this.soundboard.playables.findIndex(x => equals(x, p));
        if (index) this.soundboard.playables.splice(index, 1);
    };
}

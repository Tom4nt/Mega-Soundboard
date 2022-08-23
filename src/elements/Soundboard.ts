import { Keys, MS, Soundboard as SoundboardModel } from "../Models";

export default class Soundboard extends HTMLElement {
    private indicatorElement: HTMLDivElement | null = null;
    private titleElement: HTMLSpanElement | null = null;
    private descriptionElement: HTMLSpanElement | null = null;

    private playingSoundCount = 0;

    get isSelected(): boolean {
        return this.classList.contains("selected");
    }
    set isSelected(v: boolean) {
        if (v) this.classList.add("selected");
        else this.classList.remove("selected");
    }

    constructor(public readonly soundboard: SoundboardModel) {
        super();
    }

    protected connectedCallback(): void {
        this.classList.add("item");
        if (this.soundboard.linkedFolder) this.classList.add("linked");

        const indicator = document.createElement("div");
        indicator.classList.add("indicator");
        this.indicatorElement = indicator;

        const title = document.createElement("span");
        title.classList.add("title");
        title.innerHTML = this.soundboard.name;
        this.titleElement = title;

        const desc = document.createElement("span");
        if (this.soundboard.keys) desc.innerHTML = Keys.toKeyString(this.soundboard.keys);
        desc.classList.add("desc");
        this.descriptionElement = desc;

        const icon = document.createElement("span");
        if (this.soundboard.linkedFolder) icon.innerHTML = "link";
        icon.classList.add("icon");
        MS.addPopup("This soundboard is linked to a folder", icon);

        this.append(indicator, title, desc, icon);
    }

    updateElements(): void {
        if (this.titleElement) this.titleElement.innerHTML = this.soundboard.name;
        this.classList.remove("linked");
        if (this.soundboard.linkedFolder) this.classList.add("linked");
        if (this.descriptionElement) {
            if (this.soundboard.keys) this.descriptionElement.innerHTML = Keys.toKeyString(this.soundboard.keys);
            else this.descriptionElement.innerHTML = "";
        }
        if (this.indicatorElement) this.indicatorElement.innerHTML = this.soundboard.linkedFolder ? "link" : "";
    }

    updatePlayingIndicator(playingSoundCountSum: number): void {
        if (this.playingSoundCount) this.playingSoundCount += playingSoundCountSum;
        else this.playingSoundCount = playingSoundCountSum;

        if (this.playingSoundCount < 0) this.playingSoundCount = 0; // Not supposed to happen

        this.setPlayingIndicatorState(this.playingSoundCount > 0);
    }

    setPlayingIndicatorState(state: boolean): void {
        if (!this.titleElement) return;
        if (state) {
            this.titleElement.style.fontWeight = "1000";
        } else {
            this.titleElement.style.fontWeight = "";
        }
    }
}
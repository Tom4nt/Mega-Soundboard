import Utils from "../util/utils";
import IconButton from "./iconButton";
import Slider from "./slider";

export default class Seekbar extends HTMLElement {
    private didConnect = false;
    private sliderElement: Slider;
    private buttonElement: IconButton;
    private timeElement: HTMLSpanElement;

    private _currentMedia: HTMLMediaElement | null = null;
    get currentMedia(): HTMLMediaElement | null { return this._currentMedia; }
    set currentMedia(value: HTMLMediaElement | null) {
        if (this._currentMedia) this.removeMediaListeners(this._currentMedia);
        this._currentMedia = value;
        if (value) this.addMediaListeners(value);
        this.setVisibility(value != null);
        this.update();
    }

    constructor() {
        super();
        this.sliderElement = new Slider("");
        this.buttonElement = new IconButton();
        this.timeElement = document.createElement("span");
    }

    protected connectedCallback(): void {
        if (this.didConnect) return;

        this.buttonElement.innerHTML = "play";
        this.buttonElement.addEventListener("click", this.handlePlayPauseClick);

        this.timeElement.innerHTML = "00:00";

        this.sliderElement.max = 1;
        this.sliderElement.step = null;

        this.append(this.buttonElement, this.timeElement, this.sliderElement);
        this.didConnect = true;
    }

    private addMediaListeners(media: HTMLMediaElement): void {
        media.addEventListener("timeupdate", this.handleUpdate);
        media.addEventListener("play", this.handlePlay);
        media.addEventListener("pause", this.handlePause);
    }

    private removeMediaListeners(media: HTMLMediaElement): void {
        media.removeEventListener("timeupdate", this.handleUpdate);
        media.removeEventListener("play", this.handlePlay);
        media.removeEventListener("pause", this.handlePause);
    }

    private setVisibility(value: boolean): void {
        if (value)
            this.classList.add("visible");
        else
            this.classList.remove("visible");
    }

    private update(): void {
        if (!this.currentMedia) return;
        this.buttonElement.innerHTML = this.currentMedia.paused ? "play" : "pause";
        this.updateTime();
    }

    private updateTime(): void {
        const m = this.currentMedia;
        if (!m) return;
        this.sliderElement.value = m.currentTime / m.duration;
        this.timeElement.innerHTML = Utils.getTimeString(m.currentTime);
    }

    // Handlers

    private handlePlayPauseClick = (): void => {
        if (!this.currentMedia) return;
        const m = this.currentMedia;
        if (m.paused) void m.play();
        else m.pause();
    };

    private handleUpdate = (): void => {
        this.updateTime();
    };

    private handlePlay = (): void => {
        this.buttonElement.innerHTML = "pause";
    };

    private handlePause = (): void => {
        this.buttonElement.innerHTML = "play";
    };
}

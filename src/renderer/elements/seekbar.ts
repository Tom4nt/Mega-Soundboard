import AudioInstance from "../models/audioInstance";
import MSR from "../msr";
import Utils from "../util/utils";
import IconButton from "./iconButton";
import Slider from "./slider";

export default class Seekbar extends HTMLElement {
	private didConnect = false;
	private wasPaused = false;
	private isScrubbing = false;
	private sliderElement: Slider;
	private buttonElement: IconButton;
	private timeElement: HTMLSpanElement;

	private _currentInstance: AudioInstance | null = null;
	get currentInstance(): AudioInstance | null {
		return this._currentInstance;
	}
	set currentInstance(value: AudioInstance | null) {
		if (this._currentInstance) {
			this.removeInstanceListeners(this._currentInstance);
		}
		this.isScrubbing = false;
		this._currentInstance = value;
		if (value) this.addInstanceListeners(value);
		this.setVisibility(value != null);
		this.update();
	}

	constructor() {
		super();
		this.sliderElement = new Slider(undefined, 1);
		this.buttonElement = new IconButton();
		this.timeElement = document.createElement("span");
	}

	protected connectedCallback(): void {
		if (this.didConnect) return;

		this.buttonElement.setAttribute("icon", "play_arrow");
		this.buttonElement.addEventListener("click", this.handlePlayPauseClick);

		this.timeElement.innerHTML = "00:00";

		this.sliderElement.step = null;
		this.sliderElement.addEventListener("change", this.handleChange);
		this.sliderElement.addEventListener("input", this.handleInput);

		this.append(this.buttonElement, this.timeElement, this.sliderElement);
		this.style.display = "none";
		this.didConnect = true;

		MSR.instance.audioPlayer.seekbarUpdate.addHandler(this.handlePlayingInstanceChanged);
	}

	protected disconnectedCallback(): void {
		MSR.instance.audioPlayer.seekbarUpdate.removeHandler(this.handlePlayingInstanceChanged);
	}

	private addInstanceListeners(instance: AudioInstance): void {
		instance.onTimeUpdate.addHandler(this.handleUpdate);
		instance.onPlay.addHandler(this.handlePlay);
		instance.onPause.addHandler(this.handlePause);
	}

	private removeInstanceListeners(instance: AudioInstance): void {
		instance.onTimeUpdate.removeHandler(this.handleUpdate);
		instance.onPlay.removeHandler(this.handlePlay);
		instance.onPause.removeHandler(this.handlePause);
	}

	private setVisibility(value: boolean): void {
		if (value) {
			this.style.display = "";
			void this.offsetWidth; // Trigger reflow
			this.classList.add("visible");
		} else {
			this.classList.remove("visible");
			setTimeout(() => {
				if (!this.currentInstance) this.style.display = "none";
			}, 200);
		}
	}

	private update(): void {
		if (!this.currentInstance) return;
		this.buttonElement.setIcon(this.currentInstance.isPaused
			? "play_arrow"
			: "pause"
		);
		this.updateTime();
	}

	private updateTime(): void {
		const m = this.currentInstance;
		if (!m) return;
		this.sliderElement.value = m.currentTime / m.duration;
		this.timeElement.innerHTML = Utils.getTimeString(m.currentTime);
	}

	// Handlers

	private handlePlayingInstanceChanged = (audioInstance: AudioInstance | null): void => {
		this.currentInstance = audioInstance;
	};

	private handlePlayPauseClick = (): void => {
		if (!this.currentInstance) return;
		const m = this.currentInstance;
		if (m.isPaused) void m.play();
		else m.pause();
	};

	private handleChange = (): void => {
		if (!this.currentInstance) return;
		if (!this.wasPaused) {
			void this.currentInstance.play();
		}
		this.isScrubbing = false;
	};

	private handleInput = (): void => {
		if (!this.currentInstance) return;
		if (!this.isScrubbing) {
			this.isScrubbing = true;
			this.wasPaused = this.currentInstance.isPaused;
			this.currentInstance.pause();
		}
		this.currentInstance.currentTime =
			this.currentInstance.duration * this.sliderElement.value;
	};

	private handleUpdate = (): void => {
		this.updateTime();
	};

	private handlePlay = (): void => {
		this.buttonElement.setIcon("pause");
	};

	private handlePause = (): void => {
		this.buttonElement.setIcon("play_arrow");
	};
}

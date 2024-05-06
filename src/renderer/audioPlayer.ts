import { IPlayArgs, UISound } from "../shared/interfaces";
import { Event, ExposedEvent } from "../shared/events";
import AudioInstance from "./models/audioInstance";
import { UISoundPath } from "./models";
import { PlayData } from "../shared/models/dataInterfaces";
import { MessageModal } from "./modals";
import Utils from "./util/utils";

export default class AudioPlayer {
	private readonly _seekbarUpdate = new Event<AudioInstance | null>();
	private readonly playingInstances: AudioInstance[] = [];
	private currentSingleInstance: AudioInstance | null = null;
	private uiMediaElement = new Audio();

	constructor() {
		window.events.play.addHandler(this.handlePlay);
		window.events.stop.addHandler(this.handleStop);
	}

	get seekbarUpdate(): ExposedEvent<AudioInstance | null> { return this._seekbarUpdate.expose(); }

	static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
		const devices = await navigator.mediaDevices.enumerateDevices();
		const filtered = devices.filter(d => d.kind == "audiooutput" && d.deviceId != "communications");
		return filtered;
	}

	async playUI(uiSound: UISound): Promise<void> {
		this.uiMediaElement.src = UISoundPath[uiSound];
		this.uiMediaElement.load();
		await this.uiMediaElement.play();
	}

	/** Updates the seekbar state only if needed. */
	private updateSeekbar(): void {
		const previous = this.currentSingleInstance;
		this.currentSingleInstance = this.playingInstances.length === 1 ? this.playingInstances[0]! : null;
		if (previous != this.currentSingleInstance)
			this._seekbarUpdate.raise(this.currentSingleInstance);
	}

	handlePlay = async (e: IPlayArgs): Promise<void> => {
		try {
			const d = e.data;
			const instance = await AudioInstance.create(
				d.mainPlayableUuid, d.volume, d.path, d.devices, d.loops
			);
			this.playingInstances.push(instance);
			this.updateSeekbar();

			instance.onEnd.addHandler(() => {
				this.playingInstances.splice(this.playingInstances.indexOf(instance), 1);
				this.updateSeekbar();
				window.actions.soundEnd(instance.playableUuid);
			});
			await instance.play();
		} catch (error) {
			window.actions.soundEnd(e.data.mainPlayableUuid);
			void this.playUI("error");
			if (!e.softError)
				new MessageModal("Could not play", Utils.getErrorMessage(error), true).open();
		}
	};

	handleStop = async (data: PlayData): Promise<void> => {
		const instances = this.playingInstances.filter(i => i.playableUuid === data.mainPlayableUuid);
		for (const instance of instances) {
			instance.stop();
			this.playingInstances.splice(this.playingInstances.indexOf(instance), 1);
		}
		this.updateSeekbar();
	};
}

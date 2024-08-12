import { IDevice, IPlayArgs, UISound } from "../shared/interfaces";
import { Event, ExposedEvent } from "../shared/events";
import AudioInstance from "./models/audioInstance";
import { UISoundPath } from "./models";
import { MessageModal } from "./modals";
import Utils from "./util/utils";
import { Audio } from "../shared/models/dataInterfaces";

export default class AudioPlayer {
	private readonly _seekbarUpdate = new Event<AudioInstance | null>();
	private readonly playingInstances: AudioInstance[] = [];
	private currentSingleInstance: AudioInstance | null = null;
	private uiMediaElement = new Audio();

	constructor() {
		window.events.play.addHandler(this.handlePlay);
		window.events.stop.addHandler(this.handleStop);
		window.events.playError.addHandler(this.handlePlayError);
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
		const d = e.data;
		const instances = await this.createInstances(d.sounds, d.devices, d.loops);
		this.playingInstances.push(...instances);
		this.updateSeekbar();
		const showsErrorMessage = !e.softError && d.sounds.length === 1;

		for (const instance of instances) {
			try {
				await instance.play();
			} catch (error) {
				window.actions.soundEnd(instance.playableUuid);
				void this.playUI("error");
				if (showsErrorMessage)
					void new MessageModal("Could not play", Utils.getErrorMessage(error), true).open();
			}
		}
	};

	handleStop = async (uuid: string): Promise<void> => {
		const instances = this.playingInstances.filter(i => i.playableUuid === uuid);
		for (const instance of instances) {
			instance.stop();
			this.playingInstances.splice(this.playingInstances.indexOf(instance), 1);
		}
		this.updateSeekbar();
	};

	handlePlayError = (error: string): void => {
		const errorModal = new MessageModal("Could not Play", error, true);
		void errorModal.open();
	};

	private async createInstances(sounds: Audio[], devices: readonly IDevice[], loop: boolean): Promise<readonly AudioInstance[]> {
		return await Promise.all(sounds.map(async s => {
			const instance = await AudioInstance.create(s.uuid, s.volume, s.path, devices, loop);
			instance.onEnd.addHandler(() => {
				this.playingInstances.splice(this.playingInstances.indexOf(instance), 1);
				this.updateSeekbar();
				window.actions.soundEnd(instance.playableUuid);
			});
			return instance;
		}));
	}
}

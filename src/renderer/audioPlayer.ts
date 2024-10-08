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

	public static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
		const devices = await navigator.mediaDevices.enumerateDevices();
		const filtered = devices.filter(d => d.kind == "audiooutput" && d.deviceId != "communications");
		return filtered;
	}

	public async playUI(uiSound: UISound): Promise<void> {
		this.uiMediaElement.src = UISoundPath[uiSound];
		this.uiMediaElement.load();
		await this.uiMediaElement.play();
	}

	/** Recalculates the volume of all sounds playing on the specified device. */
	public updateVolumesOnDevice(device: IDevice): void {
		for (const instance of this.playingInstances) {
			instance.updateVolume(device);
		}
	}

	/** Sets the value of the "loop" property of all sounds playing. */
	public setLoopState(value: boolean): void {
		for (const instance of this.playingInstances) {
			instance.loop = value;
		}
	}

	/** Updates the seekbar state only if needed. */
	private updateSeekbar(): void {
		const previous = this.currentSingleInstance;
		this.currentSingleInstance = this.playingInstances.length === 1 ? this.playingInstances[0]! : null;
		if (previous != this.currentSingleInstance)
			this._seekbarUpdate.raise(this.currentSingleInstance);
	}

	private showError(error: unknown): void {
		void new MessageModal("Could not play", Utils.getErrorMessage(error), true).open();
	}

	handlePlay = async (e: IPlayArgs): Promise<void> => {
		const d = e.data;
		const showsErrorMessage = !e.softError && d.sounds.length === 1;

		let instances: readonly AudioInstance[] = [];
		try {
			instances = await this.createInstances(d.sounds, d.devices, d.loops);
		} catch (error) {
			e.data.sounds.forEach(s => window.actions.soundEnd(s.uuid));
			void this.playUI("error");
			if (showsErrorMessage) this.showError(error);
		}

		this.playingInstances.push(...instances);
		this.updateSeekbar();

		for (const instance of instances) {
			try {
				await instance.play();
			} catch (error) {
				window.actions.soundEnd(instance.playableUuid);
				void this.playUI("error");
				if (showsErrorMessage) this.showError(error);
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
		void this.playUI("error");
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

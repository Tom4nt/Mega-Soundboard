import { Event, ExposedEvent } from "../../shared/events";
import { IDevice } from "../../shared/interfaces";

/** Represents a single sound playing on multiple devices. */
export default class AudioInstance {
	public readonly duration: number;

	private constructor(
		public readonly playableUuid: string,
		public readonly playableVolume: number,
		public readonly audioElements: HTMLAudioElement[],
		private readonly stopEvent: Event<void>,
		private readonly pauseEvent: Event<void>,
		private readonly playEvent: Event<void>,
		private readonly timeUpdateEvent: Event<void>,
	) {
		this.duration = audioElements.length > 0 ? audioElements[0]!.duration : 0;
	}

	public get onEnd(): ExposedEvent<void> { return this.stopEvent.expose(); }
	public get onPause(): ExposedEvent<void> { return this.pauseEvent.expose(); }
	public get onPlay(): ExposedEvent<void> { return this.playEvent.expose(); }
	public get onTimeUpdate(): ExposedEvent<void> { return this.timeUpdateEvent.expose(); }

	public get currentTime(): number { return this.getAny()?.currentTime ?? 0; }
	public set currentTime(value: number) { this.audioElements.forEach(e => e.currentTime = value); }

	public get loop(): boolean { return this.getAny()?.loop ?? false; }
	public set loop(value: boolean) { this.audioElements.forEach(e => e.loop = value); }

	public get isPaused(): boolean { return this.getAny()?.paused ?? true; }

	public static async create(
		playableUuid: string,
		volume: number,
		path: string,
		devices: readonly IDevice[],
		loop: boolean,
	): Promise<AudioInstance> {
		const audioElements: HTMLAudioElement[] = [];
		const stopEvent = new Event<void>();
		const pauseEvent = new Event<void>();
		const playEvent = new Event<void>();
		const timeUpdateEvent = new Event<void>();

		let isFirst = true;
		for (const device of devices) {
			const audio = new Audio();
			audio.src = path;
			audio.loop = loop;

			if (isFirst) {
				// Wait for metadata to load only if it's not ready. (otherwise loadedmetadata would never fire)
				if (audio.readyState <= 0) {
					await new Promise<void>((resolve, reject) => {
						audio.addEventListener("loadedmetadata", () => {
							resolve();
						});
						audio.addEventListener("error", () => {
							reject(new Error(`Make sure the file exists at ${path}.`));
						});
					});
				}
			}

			try {
				await audio.setSinkId(device.id);
			} catch (error) {
				void error;
				if (isFirst) { // We must play to at least one device.
					// If setSinkId fails, it is set to the default device.
					console.log(`Invalid sinkId: '${device.id}'. Using default device.`);
				} else {
					console.log(`Ignoring invalid sinkId '${device.id}'.`);
					continue;
				}
			}

			audio.addEventListener("ended", () => {
				audioElements.splice(audioElements.indexOf(audio), 1);
				if (audioElements.length <= 0) {
					stopEvent.raise();
				}
			});

			audio.volume = Math.pow((device.volume / 100) * volume, 2);
			audioElements.push(audio);
			isFirst = false;
		}

		const firstAudioElement = audioElements[0];
		if (!firstAudioElement) throw new Error("No audio elements added.");

		firstAudioElement.addEventListener("pause", () => pauseEvent.raise());
		firstAudioElement.addEventListener("play", () => playEvent.raise());
		firstAudioElement.addEventListener("timeupdate", () => timeUpdateEvent.raise());

		return new AudioInstance(
			playableUuid, volume, audioElements, stopEvent, pauseEvent, playEvent, timeUpdateEvent
		);
	}

	public pause(): void {
		this.audioElements.forEach(x => x.pause());
	}

	public stop(): void {
		this.pause();
		this.audioElements.length = 0;
	}

	public async play(): Promise<void> {
		const playTasks: Promise<void>[] = [];
		for (const audioElement of this.audioElements) {
			// Some audio files cause "PIPELINE_ERROR_READ: FFmpegDemuxer: demuxer seek failed" when seeked to the end.
			// Cannot find a lot of info about this, but loading the audio again prevents it from being stuck forever.
			if (audioElement.error) {
				audioElement.load();
			} else {
				const t = audioElement.play();
				playTasks.push(t);
			}
		}
		await Promise.all(playTasks);
	}

	/** Recalculates the volume if playing on the specified device. If not, ignores. */
	public updateVolume(device: IDevice): void {
		for (const element of this.audioElements) {
			if (device.id === element.sinkId) {
				element.volume = (device.volume / 100) * this.playableVolume;
			}
		}
	}

	// Audio elements are always synced so we can get info from any of them.
	private getAny(): HTMLAudioElement | null {
		return this.audioElements.length > 0 ? this.audioElements[0]! : null;
	}
}

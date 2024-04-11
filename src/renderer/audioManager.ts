import { Event, ExposedEvent } from "../shared/events";
import { AudioInstance, UISoundPath } from "./models";
import { IDevice } from "../shared/interfaces";
import { ISettingsData, PlayData, UuidHierarchy } from "../shared/models/dataInterfaces";

// TODO: Manage audio on the main process instead, so we can always have access to the data. Audio will still play on the render process.
export default class AudioManager {
	overlapSounds = false;

	private _loops = false;
	get loops(): boolean { return this._loops; }
	set loops(value: boolean) {
		this._loops = value;
		this.playingInstances.forEach(e => e.loop = value);
	}

	private mainDevice: string;
	private mainDeviceVolume: number;
	private secondaryDevice: string;
	private secondaryDeviceVolume: number;
	private currentKeyHoldHandle: string | null = null;

	/** Internal Media Element used for app sounds. */
	private uiMediaElement = new Audio();

	get onPlay(): ExposedEvent<PlayData> { return this._onPlay.expose(); }
	private readonly _onPlay = new Event<PlayData>();

	get onStop(): ExposedEvent<UuidHierarchy> { return this._onStop.expose(); }
	private readonly _onStop = new Event<UuidHierarchy>();

	/** Used when sounds do not overlap. */
	private readonly _onSingleInstanceChanged = new Event<AudioInstance | null>();
	get onSingleInstanceChanged(): ExposedEvent<AudioInstance | null> { return this._onSingleInstanceChanged.expose(); }

	playingInstances: AudioInstance[] = [];

	constructor(settings: ISettingsData) {
		this.mainDevice = settings.mainDevice;
		this.mainDeviceVolume = settings.mainDeviceVolume;
		this.secondaryDevice = settings.secondaryDevice;
		this.secondaryDeviceVolume = settings.secondaryDeviceVolume;
		this.overlapSounds = settings.quickActionStates.get("toggleSoundOverlap")!;
		this.loops = settings.quickActionStates.get("toggleSoundLooping")!;

		window.events.settingsChanged.addHandler(settings => {
			this.overlapSounds = settings.quickActionStates.get("toggleSoundOverlap")!;
			this.loops = settings.quickActionStates.get("toggleSoundLooping")!;
			this.mainDevice = settings.mainDevice;
			this.mainDeviceVolume = settings.mainDeviceVolume;
			this.secondaryDevice = settings.secondaryDevice;
			this.secondaryDeviceVolume = settings.secondaryDeviceVolume;
		});

		window.events.keybindsStateChanged.addHandler(s => {
			void this.playUISound(s ? UISoundPath.ON : UISoundPath.OFF);
		});

		window.events.playableRemoved.addHandler(async s => {
			await this.stop(s.uuid);
		});

		window.events.stopAll.addHandler(async () => {
			await this.stopAll();
		});

		window.events.playRequested.addHandler(async s => {
			try {
				await this.play(s);
			} catch (error) {
				await this.playUISound(UISoundPath.ERROR);
			}
		});

		window.events.stopRequested.addHandler(async uuid => {
			await this.stop(uuid);
		});
	}

	static parseDevices(settings: ISettingsData): IDevice[] {
		const devices: IDevice[] = [
			{ id: settings.mainDevice, volume: settings.mainDeviceVolume }
		];
		if (settings.secondaryDevice) {
			devices.push({ id: settings.secondaryDevice, volume: settings.secondaryDeviceVolume });
		}
		return devices;
	}

	static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
		const devices = await navigator.mediaDevices.enumerateDevices();
		const filtered = devices.filter(d => d.kind == "audiooutput" && d.deviceId != "communications");
		return filtered;
	}

	async play(data: PlayData): Promise<void> {
		if (!this.overlapSounds) await this.stopAllInternal(false);

		// In the future, devices will be stored as an array and the user will be able to add/remove them.
		const devices: IDevice[] = [{ id: this.mainDevice, volume: this.mainDeviceVolume }];
		if (this.secondaryDevice) devices.push({ id: this.secondaryDevice, volume: this.secondaryDeviceVolume });

		try {
			const instance = await AudioInstance.create(
				{ uuid: data.mainUuid, volume: data.volume, path: data.path },
				devices, this.loops
			);

			instance.onEnd.addHandler(async () => {
				console.log(`Instance of ${data.mainUuid} finished playing.`);
				this.playingInstances.splice(this.playingInstances.indexOf(instance), 1);
				const dataAfter = await window.actions.getPlayData(data.mainUuid);
				if (!dataAfter) throw Error("Could not find PlayData onEnd.");
				this._onStop.raise(dataAfter.hierarchy);
				void this.updatePTTState();
				this.raiseSingleInstanceCheckUpdate();
			});

			await instance.play();
			this.playingInstances.push(instance);

		} catch (error) {
			void this.updatePTTState();
			this.raiseSingleInstanceCheckUpdate();
			throw error;
		}

		console.log(`Added and playing instance of sound at ${data.mainUuid}.`);

		this._onPlay.raise(data);
		void this.updatePTTState();
		this.raiseSingleInstanceCheckUpdate();
	}

	/** Stops all instances of the specified Playable. */
	async stop(uuid: string): Promise<void> {
		const data = await window.actions.getPlayData(uuid);
		if (!data) throw Error("Could not stop sound. PlayData not found.");
		this.stopInternal(data.mainUuid, data.hierarchy, true);
	}

	async stopMultiple(uuids: Iterable<string>): Promise<void> {
		const uuidArray = Array.from(uuids);
		const playDatas = await window.actions.getPlayDataMultiple(uuidArray);
		for (const data of playDatas) {
			this.stopInternal(data.mainUuid, data.hierarchy, false);
		}
		void this.updatePTTState();
		this.raiseSingleInstanceCheckUpdate();
	}

	stopAll(): Promise<void> {
		return this.stopAllInternal(true);
	}

	isPlaying(uuid: string): boolean {
		const instance = this.playingInstances.find(x => x.uuid == uuid);
		return instance !== undefined;
	}

	isAnyPlaying(): boolean {
		return this.playingInstances.length > 0;
	}

	async playUISound(path: UISoundPath): Promise<void> {
		this.uiMediaElement.src = path;
		this.uiMediaElement.load();
		await this.uiMediaElement.play();
	}

	private async updatePTTState(): Promise<void> {
		const playing = this.isAnyPlaying();
		if (playing && !this.currentKeyHoldHandle) {
			this.currentKeyHoldHandle = await window.actions.holdPTT();
		}
		if (!playing && this.currentKeyHoldHandle) {
			await window.actions.releasePTT(this.currentKeyHoldHandle);
			this.currentKeyHoldHandle = null;
		}
	}

	private raiseSingleInstanceCheckUpdate(): void {
		if (this.playingInstances.length == 1) {
			this._onSingleInstanceChanged.raise(this.playingInstances[0]!);
		} else {
			this._onSingleInstanceChanged.raise(null);
		}
	}

	private async stopAllInternal(raiseUpdates: boolean): Promise<void> {
		const playDatas = await window.actions.getPlayDataMultiple(this.playingInstances.map(x => x.uuid));
		for (const playing of playDatas) {
			const id = playing.mainUuid;
			this.stopInternal(id, playing.hierarchy, raiseUpdates);
		}
	}

	private stopInternal(uuid: string, hierarchy: UuidHierarchy, raiseUpdates: boolean): void {
		const instances = this.playingInstances.filter(x => x.uuid === uuid);
		if (instances.length <= 0) return;
		const instance = instances[0]!;

		instance.stop();
		this.playingInstances.splice(this.playingInstances.indexOf(instance), 1);
		this._onStop.raise(hierarchy);
		console.log(`Stopped an instance of the Playable with UUID ${uuid}.`);

		if (raiseUpdates) {
			void this.updatePTTState();
			this.raiseSingleInstanceCheckUpdate();
		}
	}
}

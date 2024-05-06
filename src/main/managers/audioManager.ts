import { ExposedEvent, Event } from "../../shared/events";
import { IPlayable } from "../data/models/interfaces";
import EventSender from "../eventSender";
import MS from "../ms";

// TODO: Review

// The audio is actually played on the renderer process using HTMLAudioElement.
// The audio manager is in the main process to have access to all the data.
// Otherwise, we would have to send current playing sounds to the main process before loading a soundboard.
export default class AudioManager {
	// set loops(value: boolean) {
	// 	this._loops = value;
	// TODO: Send "loops" info do renderer for currenlty playing sounds.
	// this.playingInstances.forEach(e => e.loop = value);
	// }

	private currentKeyHoldHandle: string | null = null;

	/** Used when sounds do not overlap. */
	private readonly _onSingleInstanceChanged = new Event<IPlayable | null>();
	get onSingleInstanceChanged(): ExposedEvent<IPlayable | null> { return this._onSingleInstanceChanged.expose(); }

	/** Uuids of currently playing instances. */
	playingInstances: string[] = [];

	constructor() {
		// TODO: Call directly from keybindsStateChanged function.
		// window.events.keybindsStateChanged.addHandler(s => {
		// 	void this.playUISound(s ? "on" : "off");
		// });

		// TODO: Call directly from playable remove function.
		// window.events.playableRemoved.addHandler(async s => {
		// 	await this.stop(s.uuid);
		// });
	}

	play(uuid: string, softError: boolean): void {
		const playData = MS.instance.soundboardsCache.getPlayData([uuid])[0];
		if (!playData) throw Error(`Playable with UUID ${uuid} not found.`);

		const overlap = MS.instance.settingsCache.settings.quickActionStates.get("toggleSoundOverlap")!;
		if (!overlap) this.stopAllInternal();

		this.playingInstances.push(uuid);
		console.log(`Added instance of Playable with UUID ${uuid}.`);

		EventSender.send("play", { data: playData, softError });
		this.notifyPlaying([uuid]); // No problem notifying multiple times for the same sound.
		this.updatePTTState();
	}

	/** Stops a single instance of the specified Playable. */
	stopInstance(uuid: string): void {
		const instanceIndex = this.playingInstances.findIndex(i => i === uuid);
		if (instanceIndex < 0) return; // Already stopped.
		const instanceCount = this.getPlayingInstanceCount(uuid);
		if (instanceCount === 1) { // It's going to stop.
			this.notifyNotPlaying(uuid);
		}

		this.playingInstances.splice(instanceIndex, 1);
		console.log(`Removed instance of Playable with UUID ${uuid}.`);

		if (instanceCount === 1) { // Was one. It's now 0.
			const data = MS.instance.soundboardsCache.getPlayData([uuid])[0];
			if (!data) throw Error("Play data not found for playable that ended.");
			EventSender.send("stop", data);
			console.log(`Stopped all instances of the Playable with UUID ${data.mainPlayableUuid}.`);
		}
		this.updatePTTState();
	}

	/** Stops all instances of the specified Playable. */
	stop(uuid: string): void {
		const playData = MS.instance.soundboardsCache.getPlayData([uuid])[0];
		if (!playData) throw Error("Could not stop sound. PlayData not found.");

		this.stopInstancesOf(playData.mainPlayableUuid);
		this.updatePTTState();
	}

	/** Stops all instances of the specified Playables. */
	stopMultiple(uuids: Iterable<string>): void {
		const uuidArray = Array.from(uuids);
		const playData = MS.instance.soundboardsCache.getPlayData(uuidArray);
		for (const data of playData) {
			this.stopInstancesOf(data.mainPlayableUuid);
		}
		this.updatePTTState();
	}

	stopAll(): void {
		this.stopAllInternal();
		this.updatePTTState();
	}

	/** Returns the number of instances of playable that are playing. */
	getPlayingInstanceCount(uuid: string): number {
		return this.playingInstances.filter(x => x == uuid).length;
	}

	isAnyPlaying(): boolean {
		return this.playingInstances.length > 0;
	}

	private updatePTTState(): void {
		const playing = this.isAnyPlaying();
		if (playing && !this.currentKeyHoldHandle) {
			this.currentKeyHoldHandle =
				MS.instance.keybindManager.holdKeys(MS.instance.settingsCache.settings.pttKeys);
		}
		if (!playing && this.currentKeyHoldHandle) {
			MS.instance.keybindManager.releaseKeys(this.currentKeyHoldHandle);
			this.currentKeyHoldHandle = null;
		}
	}

	private stopAllInternal(): void {
		const playData = MS.instance.soundboardsCache.getPlayData(this.playingInstances);
		for (const playing of playData) {
			this.stopInstancesOf(playing.mainPlayableUuid);
		}
	}

	/** Stops all instances of the specified Playable. */
	private stopInstancesOf(playableUuid: string): void {
		const instances = this.playingInstances.filter(x => x === playableUuid);
		if (instances.length <= 0) return;
		const instancesCopy = [...instances];

		this.notifyNotPlaying(playableUuid);

		for (const instance of instancesCopy) {
			this.playingInstances.splice(this.playingInstances.indexOf(instance), 1);
		}

		const data = MS.instance.soundboardsCache.getPlayData([playableUuid])[0];
		if (!data) throw Error(`Cannot find PlayData of Playable with UUID ${playableUuid} to send to renderer process.`);
		EventSender.send("stop", data);
		console.log(`Stopped all instances of the Playable with UUID ${data.mainPlayableUuid}.`);
	}

	private notifyPlaying(uuids: string[]): void {
		const hierarchies = MS.instance.soundboardsCache.getHierarchies(uuids);
		const playingUuids = hierarchies.flat(1);
		EventSender.send("playing", playingUuids);
	}

	private notifyNotPlaying(uuid: string): void {
		/** If a sound is the only one playing in a container, the container must be notified that it stopped playing
		 * (its playing indicator is hidden). However, if the container has other playing sounds that are not stopped,
		 * it must not be notified, because it should keep displaying its playing indicator.
		 * This function calculates the playables that should be notified when a playable is no longer playing. */

		const playingUuids = this.getPlayingFusedUuids();
		const sounds = MS.instance.soundboardsCache.getAllSounds(uuid);
		const notPlayingHierarchies = MS.instance.soundboardsCache.getHierarchies(sounds.map(s => s.uuid));
		const notPlayingUuids = ([] as string[]).concat(...notPlayingHierarchies);

		this.removeUUIDs(playingUuids, notPlayingUuids);
		const res = notPlayingUuids.filter(x => !playingUuids.find(y => y === x));

		EventSender.send("notPlaying", res);
	}

	/** Fuses the hierarchies of currently playing sounds into a single list of UUIDs. */
	private getPlayingFusedUuids(): string[] {
		const hierarchies = MS.instance.soundboardsCache.getHierarchies(this.playingInstances);
		return ([] as string[]).concat(...hierarchies);
	}

	private removeUUIDs(source: string[], toRemove: string[]): void {
		for (const uuid of toRemove) {
			const index = source.indexOf(uuid);
			if (index >= 0) {
				source.splice(index, 1);
			}
		}
	}
}

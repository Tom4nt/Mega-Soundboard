import { ExposedEvent, Event } from "../../shared/events";
import { IPlayable } from "../data/models/interfaces";
import UuidTree from "../data/models/uuidTree";
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

		const soundboard = MS.instance.soundboardsCache.findSoundboardOf(uuid);
		if (!soundboard) throw Error("Could not find soundboard of playable to stop.");
		const tree = new UuidTree(soundboard);
		const playingBefore = [...this.playingInstances];

		this.playingInstances.splice(instanceIndex, 1);
		console.log(`Removed instance of Playable with UUID ${uuid}.`);

		this.notifyChanges(tree, tree, playingBefore, this.playingInstances);

		if (this.getPlayingInstanceCount(uuid) === 0) {
			const data = MS.instance.soundboardsCache.getPlayData([uuid])[0];
			if (!data) throw Error("Play data not found for playable that ended.");
			EventSender.send("stop", data);
			console.log(`Stopped all instances of the Playable with UUID ${data.mainPlayableUuid}.`);
		}
		this.updatePTTState();
	}

	/** Stops all instances of the specified Playable. */
	stop(uuid: string): void {
		const sb = MS.instance.soundboardsCache.findSoundboardOf(uuid);
		if (!sb) throw Error("Could not find soundboard of playable to stop.");
		const tree = new UuidTree(sb);
		const playingBefore = [...this.playingInstances];

		this.stopInstancesOf(uuid);

		this.updatePTTState();
		this.notifyChanges(tree, tree, playingBefore, this.playingInstances);
	}

	/** Stops all instances of the specified Playables. */
	stopMultiple(uuids: Iterable<string>): void {
		const tree = MS.instance.soundboardsCache.getGeneralTree();
		const playingBefore = [...this.playingInstances];
		for (const uuid of uuids) {
			this.stopInstancesOf(uuid);
		}
		this.updatePTTState();
		this.notifyChanges(tree, tree, playingBefore, this.playingInstances);
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

	/** Sends the appropriate notifications to the renderer process when a playing playable is moved. */
	notifyMove(treeBefore: UuidTree, treeAfter: UuidTree): void {
		this.notifyChanges(treeBefore, treeAfter, this.playingInstances, this.playingInstances);
	}

	private notifyPlaying(uuids: string[]): void {
		const hierarchies = MS.instance.soundboardsCache.getHierarchies(uuids);
		const playingUuids = hierarchies.flat(1);
		EventSender.send("playing", playingUuids);
	}

	// private notifyNotPlaying(uuid: string): void {
	// 	/** If a sound is the only one playing in a container, the container must be notified that it stopped playing
	// 	 * (its playing indicator is hidden). However, if the container has other playing sounds that are not stopped,
	// 	 * it must not be notified, because it should keep displaying its playing indicator.
	// 	 * This function calculates the playables that should be notified when a playable is no longer playing. */

	// 	const playingUuids = this.getPlayingFusedUuids();
	// 	const sounds = MS.instance.soundboardsCache.getAllSounds(uuid);
	// 	const notPlayingHierarchies = MS.instance.soundboardsCache.getHierarchies(sounds.map(s => s.uuid));
	// 	const notPlayingUuids = ([] as string[]).concat(...notPlayingHierarchies);

	// 	this.removeUUIDs(playingUuids, notPlayingUuids);
	// 	const res = notPlayingUuids.filter(x => !playingUuids.find(y => y === x));

	// 	EventSender.send("notPlaying", res);
	// }

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
		const tree = MS.instance.soundboardsCache.getGeneralTree();
		const playingBefore = [...this.playingInstances];
		const playData = MS.instance.soundboardsCache.getPlayData(this.playingInstances);
		for (const playing of playData) {
			this.stopInstancesOf(playing.mainPlayableUuid);
		}
		this.notifyChanges(tree, tree, playingBefore, this.playingInstances);
	}

	/** Stops all instances of the specified Playable. */
	private stopInstancesOf(playableUuid: string): void {
		const instances = this.playingInstances.filter(x => x === playableUuid);
		if (instances.length <= 0) return;
		const instancesCopy = [...instances];

		for (const instance of instancesCopy) {
			this.playingInstances.splice(this.playingInstances.indexOf(instance), 1);
		}

		const data = MS.instance.soundboardsCache.getPlayData([playableUuid])[0];
		if (!data) throw Error(`Cannot find PlayData of Playable with UUID ${playableUuid} to send to renderer process.`);
		EventSender.send("stop", data);
		console.log(`Stopped all instances of the Playable with UUID ${data.mainPlayableUuid}.`);
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

	private getChanges(
		treeBefore: UuidTree,
		treeAfter: UuidTree,
		playingBefore: string[],
		playingAfter: string[],
	): { added: string[], removed: string[] } {
		const totalPlayingBefore = treeBefore.nodes.filter(n => playingBefore.includes(n.uuid));
		const beforeWithAncestors = totalPlayingBefore.flatMap(n => n.getHierarchy()).map(n => n.uuid);

		const totalPlayingAfter = treeAfter.nodes.filter(n => playingAfter.includes(n.uuid));
		const afterWithAncestors = totalPlayingAfter.flatMap(n => n.getHierarchy()).map(n => n.uuid);

		const added = afterWithAncestors.filter(n => !beforeWithAncestors.includes(n));
		const removed = beforeWithAncestors.filter(n => !afterWithAncestors.includes(n));
		return { added, removed };
	}

	private notifyChanges(
		treeBefore: UuidTree,
		treeAfter: UuidTree,
		playingBefore: string[],
		playingAfter: string[],
	): void {
		const changes = this.getChanges(treeBefore, treeAfter, playingBefore, playingAfter);
		if (changes.removed.length > 0) EventSender.send("notPlaying", changes.removed);
		if (changes.added.length > 0) EventSender.send("playing", changes.added);
	}
}

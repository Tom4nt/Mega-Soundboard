import { ExposedEvent, Event } from "../../shared/events";
import { IDirectPlayable, IDirectPlayableChild, isIBaseChild } from "../data/models/interfaces";
import UuidTree from "../data/models/uuidTree";
import EventSender from "../eventSender";
import MS from "../ms";
import { getHierarchy } from "../utils/utils";

// The audio is actually played on the renderer process using HTMLAudioElement.
// The audio manager is in the main process to have access to all the data.
// Otherwise, we would have to send current playing sounds to the main process before loading a soundboard.
export default class AudioManager {
	private currentKeyHoldHandle: string | null = null;

	/** Used when sounds do not overlap. */
	private readonly _onSingleInstanceChanged = new Event<IDirectPlayable | null>();
	get onSingleInstanceChanged(): ExposedEvent<IDirectPlayable | null> { return this._onSingleInstanceChanged.expose(); }

	/** Uuids of currently playing instances. */
	playingInstances: string[] = [];

	play(uuid: string, softError: boolean): void {
		const overlap = MS.instance.settingsCache.settings.quickActionStates.get("toggleSoundOverlap")!;
		if (!overlap) this.stopAllInternal();

		const base = MS.instance.soundboardsCache.find(uuid);
		if (!base || !isIBaseChild(base)) throw Error("IBaseChild not found.");
		const hierarchy = getHierarchy(base);

		let playables: IDirectPlayableChild[] = [];
		try {
			playables = base.getDirectPlayables();
		} catch (error) {
			if (error instanceof Error) EventSender.send("playError", error.message);
			return;
		}

		const allUuids = [...hierarchy, ...playables.map(x => x.getUuid())];
		const playData = {
			sounds: playables.map(p => ({ uuid: p.getUuid(), path: p.getAudioPath(), volume: p.getVolume() })),
			devices: MS.instance.settingsCache.getDevices(),
			loops: MS.instance.settingsCache.settings.quickActionStates.get("toggleSoundLooping")!
		};

		this.playingInstances.push(...playData.sounds.map(x => x.uuid));

		EventSender.send("play", { data: playData, softError });
		EventSender.send("playing", allUuids); // No problem notifying multiple times for the same sound.
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

		this.notifyChanges(tree, tree, playingBefore, this.playingInstances);

		if (this.getPlayingInstanceCount(uuid) === 0) {
			EventSender.send("stop", uuid);
		}
		this.updatePTTState();
	}

	/** Stops all instances of the specified Playable. */
	stop(uuid: string): void {
		const sounds = MS.instance.soundboardsCache.getAllSounds(uuid);
		const uuids = sounds.map(s => s.uuid);

		this.stopMultiple(uuids);
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

	// ###

	private stopMultiple(uuids: Iterable<string>): void {
		const tree = MS.instance.soundboardsCache.getGeneralTree();
		const playingBefore = [...this.playingInstances];
		for (const uuid of uuids) {
			this.stopInstancesOf(uuid);
		}
		this.updatePTTState();
		this.notifyChanges(tree, tree, playingBefore, this.playingInstances);
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
		const tree = MS.instance.soundboardsCache.getGeneralTree();
		const playingBefore = [...this.playingInstances];
		for (const playing of playingBefore) {
			this.stopInstancesOf(playing);
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

		EventSender.send("stop", playableUuid);
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

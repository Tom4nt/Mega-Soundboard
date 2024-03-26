import { promises as fs } from "fs";
import DataAccess from "./dataAccess";
import EventSender from "../eventSender";
import MS from "../ms";
import path = require("path");
import { Soundboard } from "./models/soundboard";
import { IPlayableData, ISoundData, ISoundboardData, PlayData } from "../../shared/models/dataInterfaces";
import { Sound } from "./models/sound";
import { IPlayable, IPlayableContainer } from "./models/interfaces";
import { getHierarchy } from "../utils/utils";
import { ContainerSortedArgs } from "../../shared/interfaces";

export default class SoundboardsCache {
	constructor(public readonly soundboards: Soundboard[]) { }

	async addSounds(
		sounds: ISoundData[], destinationId: string | null, move: boolean, startIndex?: number
	): Promise<IPlayableContainer> {
		const targetContainer = await this.getOrCreateContainer(destinationId);
		if (!targetContainer) throw new Error("Destination container not found.");
		const destinationPath = MS.instance.settingsCache.settings.soundsLocation;
		const moveTasks: Promise<void>[] = [];
		let index = startIndex ?? targetContainer.getPlayables().length + 1;
		for (const soundData of sounds) {
			const sound = Sound.fromData(soundData);
			targetContainer.addPlayable(sound, index);
			if (move && destinationPath) {
				const basename = path.basename(sound.path);
				const soundDestination = path.join(destinationPath, basename);
				moveTasks.push(fs.rename(sound.path, soundDestination));
				sound.path = soundDestination;
			}
			EventSender.send("playableAdded", { parentUuid: targetContainer.uuid, playable: soundData, index });
			index += 1;
		}

		await Promise.all([...moveTasks, DataAccess.saveSoundboards(this.soundboards)]);
		return targetContainer;
	}

	async editPlayable(data: IPlayableData): Promise<void> {
		const playable = this.findPlayable(data.uuid);
		if (!playable) throw new Error(`Playable with runtime UUID ${data.uuid} could not be found.`);
		playable.edit(data);
		EventSender.send("playableChanged", data);
		await DataAccess.saveSoundboards(this.soundboards);
	}

	async movePlayable(
		playableId: string, destinationId: string | null, destinationIndex: number, copies: boolean
	): Promise<IPlayable> {
		let playable = this.findPlayable(playableId);
		if (!playable) throw new Error(`Playable with runtime UUID ${playableId} could not be found.`);
		const destination = await this.getOrCreateContainer(destinationId);
		if (!destination) throw new Error("Destination container not found.");
		destinationId = destination.uuid;

		if (destination.isSoundboard && (destination as Soundboard).linkedFolder !== null)
			throw Error(`Cannot ${copies ? "copy" : "move"} a sound to a linked Soundboard.`);

		const data = playable.asData();
		if (copies) {
			playable = playable.copy();
		} else {
			playable.parent?.removePlayable(playable);
			EventSender.send("playableRemoved", data);
		}

		destination.addPlayable(playable, destinationIndex);
		EventSender.send("playableAdded", { parentUuid: destinationId, playable: data, index: destinationIndex });

		await DataAccess.saveSoundboards(this.soundboards);
		return destination;
	}

	async removePlayable(uuid: string): Promise<void> {
		const playable = this.findPlayable(uuid);
		if (!playable) throw new Error(`Playable with runtime UUID ${uuid} could not be found.`);
		if (playable.parent == null) return; // Cannot be removed because it's not in a parent.
		playable.parent.removePlayable(playable);
		EventSender.send("playableRemoved", playable.asData());
		await DataAccess.saveSoundboards(this.soundboards);
	}

	async addSoundboard(soundboardData: ISoundboardData): Promise<void> {
		const soundboard = Soundboard.fromData(soundboardData);
		await this.addSoundboardInternal(soundboard);
	}

	async addQuickSoundboard(): Promise<Soundboard> {
		const sb = Soundboard.getDefault("Quick Sounds");
		await this.addSoundboardInternal(sb);
		return sb;
	}

	async editSoundboard(soundboardData: ISoundboardData): Promise<void> {
		const soundboard = this.findPlayable(soundboardData.uuid) as Soundboard | null;
		if (!soundboard) throw new Error("Soundboard not found.");
		soundboard.edit(soundboardData);
		await soundboard.syncSounds();
		EventSender.send("soundboardChanged", soundboardData);
		await DataAccess.saveSoundboards(this.soundboards);
	}

	async moveSoundboard(id: string, destinationIndex: number): Promise<void> {
		const sbIndex = this.findSoundboardIndex(id);
		const soundboard = this.soundboards[sbIndex]!;
		this.soundboards.splice(sbIndex, 1);
		EventSender.send("soundboardRemoved", soundboard.asData());
		this.soundboards.splice(destinationIndex, 0, soundboard);
		EventSender.send("soundboardAdded", { soundboard: soundboard.asData(), index: destinationIndex });
		await DataAccess.saveSoundboards(this.soundboards);
	}

	async removeSoundboard(uuid: string): Promise<void> {
		const index = this.findSoundboardIndex(uuid);
		const soundboard = this.soundboards[index];
		this.soundboards.splice(index, 1);
		EventSender.send("soundboardRemoved", soundboard?.asData());
		await DataAccess.saveSoundboards(this.soundboards);
	}

	async sortContainer(uuid: string): Promise<void> {
		const container = await this.getOrCreateContainer(uuid);
		if (!container) throw new Error("Destination container not found.");
		container.sortPlayables();
		const args: ContainerSortedArgs = {
			containerUuid: uuid,
			itemsUuids: container.getPlayables().map(p => p.uuid),
		};
		EventSender.send("containerSorted", args);
		await DataAccess.saveSoundboards(this.soundboards);
	}

	findPlayable(uuid: string): IPlayable | null {
		return this.findPlayableRecursive(p => p.uuid == uuid);
	}

	/** Finds the Soundboard where the playable whith the specified uuid is. */
	findSoundboardOf(playableUuid: string): Soundboard | undefined {
		for (const soundboard of this.soundboards) {
			const result = soundboard.findPlayablesRecursive(p => p.uuid === playableUuid);
			if (result.length > 0) return soundboard;
		}
		return undefined;
	}

	findSoundboardIndex(uuid: string): number {
		const soundboardIndex = this.soundboards.findIndex(x => x.uuid === uuid);
		if (soundboardIndex < 0) throw new Error(`Soundboard with runtime UUID ${uuid} could not be found.`);
		return soundboardIndex;
	}

	getPlayData(uuid: string): PlayData {
		const playable = this.findPlayable(uuid);
		if (!playable) throw new Error(`Playable with runtime UUID ${uuid} could not be found.`);
		return {
			mainUuid: uuid,
			hierarchy: getHierarchy(playable),
			path: playable.getAudioPath(),
			volume: playable.getFinalVolume()
		};
	}

	getAllSoundsInContainer(uuid: string): readonly Sound[] {
		const container = this.getContainer(uuid);
		if (!container) throw Error("Container not found.");
		return container.findPlayablesRecursive(p => p.isSound) as readonly Sound[];
	}

	getContainer(uuid: string): IPlayableContainer | null {
		return this.findPlayableRecursive(p => p.isContainer && p.uuid == uuid) as IPlayableContainer | null;
	}

	// ---

	private async addSoundboardInternal(soundboard: Soundboard): Promise<void> {
		this.soundboards.splice(0, 0, soundboard);
		EventSender.send("soundboardAdded", { soundboard: soundboard.asData(), index: 0 });
		await DataAccess.saveSoundboards(this.soundboards);
	}

	private async getOrCreateContainer(uuid: string | null): Promise<IPlayableContainer | null> {
		if (uuid) {
			return this.findPlayableRecursive(p => p.isContainer && p.uuid == uuid) as IPlayableContainer | null;
		}
		return await this.addQuickSoundboard();
	}

	private findPlayablesRecursive(predicate: (p: IPlayable) => boolean): readonly IPlayable[] {
		const result: IPlayable[] = [];
		for (const playable of this.soundboards) {
			if (predicate(playable)) result.push(playable);
			result.push(...(playable as IPlayableContainer).findPlayablesRecursive(predicate));
		}
		return result;
	}

	private findPlayableRecursive(predicate: (p: IPlayable) => boolean): IPlayable | null {
		const playables = this.findPlayablesRecursive(predicate);
		return playables.length > 0 ? playables[0]! : null;
	}
}

import { promises as fs } from "fs";
import DataAccess from "./dataAccess";
import EventSender from "../eventSender";
import MS from "../ms";
import * as path from "path";
import { isSoundboard, Soundboard } from "./models/soundboard";
import { IBaseData, ISoundData, ISoundboardData } from "../../shared/models/dataInterfaces";
import { Sound } from "./models/sound";
import { IBase, IBaseChild, IBaseContainer, IContainer, isIBaseChild, isIContainer } from "./models/interfaces";
import { getHierarchy } from "../utils/utils";
import { ContainerSortedArgs, PlayableAddedArgs } from "../../shared/interfaces";
import { Group } from "./models/group";
import UuidHierarchy from "./models/uuidHierarchy";
import UuidTree from "./models/uuidTree";

export default class SoundboardsCache {
	constructor(public readonly soundboards: Soundboard[]) { }

	async addSounds(
		sounds: ISoundData[], destinationId: string | null, move: boolean, startIndex?: number
	): Promise<IBase & IContainer> {
		const targetContainer = await this.getOrCreateContainer(destinationId);
		if (!targetContainer) throw new Error("Destination container not found.");
		const destinationPath = MS.instance.settingsCache.settings.soundsLocation;
		const moveTasks: Promise<void>[] = [];
		let index = startIndex ?? targetContainer.getChildren().length + 1;
		for (const soundData of sounds) {
			const sound = Sound.fromData(soundData);
			targetContainer.addChild(sound, index);
			if (move && destinationPath) {
				const basename = path.basename(sound.path);
				const soundDestination = path.join(destinationPath, basename);
				moveTasks.push(this.moveSound(sound.path, soundDestination));
				sound.path = soundDestination;
			}
			EventSender.send("playablesAdded", {
				parentUuid: targetContainer.getUuid(),
				playables: [{ playable: soundData, isPlaying: false }],
				index,
			});
			index += 1;
		}

		await Promise.all([...moveTasks, DataAccess.saveSoundboards(this.soundboards)]);
		return targetContainer;
	}

	async editPlayable(data: IBaseData): Promise<void> {
		const playable = this.find(data.uuid);
		if (!playable) throw new Error(`Playable with runtime UUID ${data.uuid} could not be found.`);
		playable.edit(data);
		EventSender.send("playableChanged", data);
		await DataAccess.saveSoundboards(this.soundboards);
	}

	async copyOrMove(
		playableId: string, destinationId: string | null, destinationIndex: number, move: boolean
	): Promise<IBaseContainer> {
		let playable = this.find(playableId);
		if (!playable) throw new Error(`Object with runtime UUID ${playableId} could not be found.`);
		if (!isIBaseChild(playable)) throw Error("Object cannot be moved because it is not an IBaseChild.");
		const destination = await this.getOrCreateContainer(destinationId);
		if (!destination) throw new Error("Destination container not found.");

		destinationId = destination.getUuid();
		const sourceUuid = playable.parent!.getUuid();
		if (sourceUuid !== destinationId && isSoundboard(destination) && destination.linkedFolder !== null) {
			throw Error(`Cannot ${move ? "move" : "copy"} a sound to a linked Soundboard.`);
		}

		const treeBefore = MS.instance.soundboardsCache.getGeneralTree();

		if (move) {
			playable.parent?.removeChild(playable);
			EventSender.send("playableRemoved", playable.asData());
		} else {
			playable = playable.copy();
		}

		destination.addChild(playable as IBaseChild, destinationIndex);
		const isPlaying = MS.instance.audioManager.getPlayingInstanceCount(playableId) > 0;
		EventSender.send("playablesAdded", {
			parentUuid: destinationId,
			playables: [{ playable: playable.asData(), isPlaying }],
			index: destinationIndex,
		});

		if (move) {
			const treeAfter = MS.instance.soundboardsCache.getGeneralTree();
			MS.instance.audioManager.notifyMove(treeBefore, treeAfter);
		}

		await DataAccess.saveSoundboards(this.soundboards);
		return destination;
	}

	async removePlayable(uuid: string): Promise<void> {
		const object = this.find(uuid);
		if (!object) throw new Error(`Object with runtime UUID ${uuid} could not be found.`);
		if (!isIBaseChild(object) || !object.parent) return; // Cannot be removed because it's not in a parent.
		MS.instance.audioManager.stop(uuid);
		object.parent.removeChild(object);
		EventSender.send("playableRemoved", object.asData());
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
		const soundboard = this.find(soundboardData.uuid) as Soundboard | null;
		if (!soundboard) throw new Error("Soundboard not found.");
		soundboard.edit(soundboardData);
		const hasLinkedSoundboardChanges = await soundboard.syncSounds();
		EventSender.send("soundboardChanged", soundboardData);
		if (hasLinkedSoundboardChanges)
			EventSender.send("currentSoundboardChanged", soundboard.asData());
		await DataAccess.saveSoundboards(this.soundboards);
	}

	async moveSoundboard(id: string, isCurrent: boolean, destinationIndex: number): Promise<void> {
		const sbIndex = this.findSoundboardIndex(id);
		const soundboard = this.soundboards[sbIndex]!;
		this.soundboards.splice(sbIndex, 1);
		EventSender.send("soundboardRemoved", soundboard.asData());
		this.soundboards.splice(destinationIndex, 0, soundboard);
		EventSender.send("soundboardAdded", {
			soundboard: soundboard.asData(),
			isCurrent: isCurrent,
			index: destinationIndex
		});
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
		container.sortChildren();
		const args: ContainerSortedArgs = {
			containerUuid: uuid,
			itemsUuids: container.getChildren().map(p => p.getUuid()),
		};
		EventSender.send("containerSorted", args);
		await DataAccess.saveSoundboards(this.soundboards);
	}

	find(uuid: string): IBase | null {
		return this.findRecursive(p => p.getUuid() == uuid);
	}

	/** Finds the Soundboard where the playable whith the specified uuid is. */
	findSoundboardOf(playableUuid: string): Soundboard | undefined {
		for (const soundboard of this.soundboards) {
			const result = soundboard.findChildrenRecursive(p => p.getUuid() === playableUuid);
			if (result.length > 0) return soundboard;
		}
		return undefined;
	}

	findSoundboardIndex(uuid: string): number {
		const soundboardIndex = this.soundboards.findIndex(x => x.uuid === uuid);
		if (soundboardIndex < 0) throw new Error(`Soundboard with runtime UUID ${uuid} could not be found.`);
		return soundboardIndex;
	}

	getHierarchies(uuids: string[]): UuidHierarchy[] {
		const bases = this.findPlayablesRecursive(p => uuids.includes(p.getUuid()));
		return bases.map((p) => getHierarchy(p));
	}

	/** If the object is a container, returns all children inside recursively. If it's a sound, returns it. */
	getAllSounds(uuid: string): readonly Sound[] {
		const base = this.find(uuid);
		if (!base) throw Error("Object not found.");
		if (isIContainer(base)) {
			return base.findChildrenRecursive(p => !isIContainer(p)) as readonly Sound[];
		} else {
			return [base as Sound];
		}
	}

	getContainer(uuid: string): IBaseContainer | null {
		return this.findRecursive(p => isIContainer(p) && p.getUuid() == uuid) as IBaseContainer | null;
	}

	getGeneralTree(): UuidTree {
		const root = {
			getUuid: (): string => "",
			getChildren: (): readonly Soundboard[] => {
				return this.soundboards;
			}
		};
		return new UuidTree(root);
	}

	async createGroup(mainUuid: string, secondUuid: string, copy: boolean): Promise<Group> {
		const mainObject = this.find(mainUuid);
		if (!mainObject) throw Error("Main object for the group could not be found.");
		if (!isIBaseChild(mainObject) || !mainObject.parent)
			throw Error("Could not get the parent of the main object where to create the group.");

		const parent = mainObject.parent;

		const secondObject = this.find(secondUuid);
		if (!secondObject || !isIBaseChild(secondObject))
			throw Error("Second object for the group could not be found.");

		if (!copy) {
			parent.removeChild(secondObject);
			EventSender.send("playableRemoved", secondObject.asData());
		}

		const index = parent.getChildren().indexOf(mainObject);
		parent.removeChild(mainObject);
		EventSender.send("playableRemoved", mainObject.asData());

		const group = Group.getWithName(mainObject.getName());
		group.addChild(mainObject);
		group.addChild(secondObject.copy());

		parent.addChild(group, index);
		EventSender.send("playablesAdded", {
			playables: [{ playable: group.asData(), isPlaying: false }],
			parentUuid: parent.getUuid(),
			index: index,
		});
		await DataAccess.saveSoundboards(this.soundboards);
		return group;
	}

	async unGroupGroup(uuid: string): Promise<void> {
		const container = this.getContainer(uuid);
		if (!container || !isIBaseChild(container)) throw Error("Group not found.");

		const children = container.getChildren();
		if (!container.parent) return;

		const parent = container.parent;
		const startIndex = parent.getChildren().indexOf(container);
		parent.removeChild(container);
		EventSender.send("playableRemoved", container.asData());

		let index = startIndex;
		for (const playable of children) {
			parent.addChild(playable, index);
			index += 1;
		}

		EventSender.send("playablesAdded", {
			parentUuid: parent.getUuid(),
			index: startIndex,
			playables: children.map((x): PlayableAddedArgs => ({
				playable: x.asData(),
				isPlaying: MS.instance.audioManager.getPlayingInstanceCount(uuid) > 0,
			}))
		});
		await DataAccess.saveSoundboards(this.soundboards);
	}

	// ---

	private async addSoundboardInternal(soundboard: Soundboard): Promise<void> {
		this.soundboards.splice(0, 0, soundboard);
		EventSender.send("soundboardAdded", {
			soundboard: soundboard.asData(),
			isCurrent: true,
			index: 0
		});
		await soundboard.syncSounds();
		EventSender.send("currentSoundboardChanged", soundboard.asData());
		await DataAccess.saveSoundboards(this.soundboards);
	}

	private async getOrCreateContainer(uuid: string | null): Promise<IBaseContainer | null> {
		if (uuid) {
			return this.findRecursive(p => isIContainer(p) && p.getUuid() == uuid) as IBaseContainer | null;
		}
		return await this.addQuickSoundboard();
	}

	private findPlayablesRecursive(predicate: (p: IBase) => boolean): readonly IBase[] {
		const result: IBase[] = [];
		for (const sb of this.soundboards) {
			if (predicate(sb)) result.push(sb);
			result.push(...sb.findChildrenRecursive(predicate));
		}
		return result;
	}

	private findRecursive(predicate: (p: IBase) => boolean): IBase | null {
		const playables = this.findPlayablesRecursive(predicate);
		return playables.length > 0 ? playables[0]! : null;
	}

	private async moveSound(currentPath: string, newPath: string): Promise<void> {
		await fs.mkdir(path.dirname(newPath), { recursive: true });
		await fs.rename(currentPath, newPath);
	}
}

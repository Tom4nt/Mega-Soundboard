import { Dirent, promises as fs } from "fs";
import * as path from "path";
import { tryGetValue } from "../../../shared/sharedUtils";
import Utils, { convertChildren } from "../../utils/utils";
import { BaseProperties } from "./baseProperties";
import { Container } from "./container";
import { IDirectPlayable, JSONObject, IBaseContainer, IBaseChild, isIContainer, isIBase, IContainer, isIDirectPlayable } from "./interfaces";
import { Sound } from "./sound";
import { randomUUID } from "crypto";
import { ISoundboardData } from "../../../shared/models/dataInterfaces";

export class Soundboard implements IBaseContainer {
	constructor(
		baseProperties: BaseProperties,
		public linkedFolder: string | null,
		children: IBaseChild[],
	) {
		this.container = new Container(children, this);
		this.uuid = baseProperties.uuid;
		this.name = baseProperties.name;
		this.keys = baseProperties.keys;
		this.volume = baseProperties.volume;
	}

	private readonly container: Container;
	readonly uuid: string;
	name: string;
	keys: number[];
	volume: number;

	getUuid(): string {
		return this.uuid;
	}

	getName(): string {
		return this.name;
	}

	getKeys(): number[] {
		return this.keys;
	}

	getVolume(): number {
		return this.volume;
	}

	getChildren(): readonly IBaseChild[] {
		return this.container.getChildren();
	}

	addChild(playable: IBaseChild, index?: number | undefined): void {
		playable.parent = this;
		this.container.addChild(playable, index);
	}

	removeChild(playable: IBaseChild): void {
		playable.parent = undefined;
		this.container.removeChild(playable);
	}

	contains(playable: IBaseChild): boolean {
		return this.container.contains(playable);
	}

	findChildrenRecursive(predicate: (p: IBaseChild) => boolean): readonly IBaseChild[] {
		return this.container.findChildrenRecursive(predicate);
	}

	sortChildren(): void {
		this.container.sortChildren();
	}

	compare(other: IBaseChild): number {
		return this.name.localeCompare(other.getName());
	}

	getDefault(uuid: string, name: string): Soundboard {
		const info = new BaseProperties(uuid, name, 100, []);
		return new Soundboard(info, null, []);
	}

	getSavable(): JSONObject {
		return {
			name: this.name,
			volume: this.volume,
			keys: this.keys,
			linkedFolder: this.linkedFolder,
			sounds: this.getChildren().map(p => p.getSavable()),
		};
	}

	edit(data: ISoundboardData): void {
		this.name = data.name;
		this.keys.length = 0;
		this.keys.push(...data.keys);
		this.volume = data.volume;
		this.linkedFolder = data.linkedFolder;
	}

	/** Adds and/or removes Sounds/Groups from the specified Soundboard as necessary
	 * to sync them with its linked folder.
	 * Returns true if changes were made. */
	async syncSounds(): Promise<boolean> {
		if (!this.linkedFolder) return false;

		let entries: Dirent[] = [];
		if (await Utils.isDirectoryAccessible(this.linkedFolder)) {
			entries = await fs.readdir(this.linkedFolder, { withFileTypes: true });
		}

		let hasChanges = false;
		if (this.linkedFolder) {
			hasChanges = await this.addSyncedSounds(entries);
		}
		if (await this.removeSyncedSounds(entries)) {
			hasChanges = true;
		}

		return hasChanges;
	}

	asData(): ISoundboardData {
		return {
			keys: this.keys,
			name: this.name,
			linkedFolder: this.linkedFolder,
			uuid: this.uuid,
			volume: this.volume,
			hasSounds: this.container.getChildren().length > 0,
			isGroup: false,
		};
	}

	static fromData(data: ISoundboardData): Soundboard {
		const s = Soundboard.getDefault("");
		s.edit(data);
		return s;
	}

	static getDefault(name: string): Soundboard {
		return new Soundboard(
			new BaseProperties(randomUUID(), name, 100, []),
			null, [],
		);
	}

	static convert(data: JSONObject): Soundboard {
		const commonInfo = BaseProperties.convert(data);

		let linkedFolder: string | null = null;
		if (typeof data["linkedFolder"] === "string") linkedFolder = data["linkedFolder"];

		let playables: IBaseChild[] = [];
		const playablesTry = tryGetValue(data, ["playables", "sounds"], x => Array.isArray(x));
		if (playablesTry) {
			playables = convertChildren(playablesTry as []);
		}

		return new Soundboard(commonInfo, linkedFolder, playables);
	}

	/** Loops through files/folders and adds unexisting sounds/groups. */
	private async addSyncedSounds(entries: Dirent[]): Promise<boolean> {
		if (!this.linkedFolder) throw Error("Cannot add synced sounds without a linkedFolder.");
		return Soundboard.addSoundsFromFiles(entries, this, this.linkedFolder);
	}

	private static addSoundsFromFiles(entries: Dirent[], container: IContainer, linkedFolder: string): boolean {
		let hasChanges = false;
		for (const entry of entries) {
			const completeName = path.join(linkedFolder, entry.name);
			if (entry.isFile()) {
				if (!Sound.isValidSoundFile(completeName)) continue;
				const soundWithPath = container.getChildren().find(
					p => !isIContainer(p) && (p as IDirectPlayable & IBaseChild).getAudioPath() == completeName
				);
				if (!soundWithPath) {
					const info = new BaseProperties(randomUUID(), Utils.getNameFromFile(completeName), 100, []);
					const s = new Sound(info, completeName);
					container.addChild(s);
					hasChanges = true;
				}
			}
		}
		return hasChanges;
	}

	/** Loops through existing sounds and removes those without a file. */
	private async removeSyncedSounds(entries: Dirent[]): Promise<boolean> {
		let hasChanges = false;
		const playables = this.container.getChildren().filter(c => {
			if (!this.linkedFolder) return true;
			if (isIDirectPlayable(c)) {
				return !entries.some(e => path.join(this.linkedFolder!, e.name) === c.getAudioPath());
			} else return false;
		});
		if (playables.length > 0) hasChanges = true;
		playables.forEach(p => p.parent?.removeChild(p));
		return hasChanges;
	}
}

export function isSoundboard(obj: object): obj is Soundboard {
	return isIBase(obj) && isIContainer(obj) && "linkedFolder" in obj;
}

import { promises as fs } from "fs";
import path = require("path");
import { tryGetValue } from "../../../shared/sharedUtils";
import Utils, { convertChildren } from "../../utils/utils";
import { BaseProperties } from "./baseProperties";
import { Container } from "./container";
import { IDirectPlayable, JSONObject, IBaseContainer, IBaseChild, isIContainer, isIBase } from "./interfaces";
import { Sound } from "./sound";
import { randomUUID } from "crypto";
import { ISoundboardData } from "../../../shared/models/dataInterfaces";

export class Soundboard implements IBaseContainer {
	constructor(
		baseProperties: BaseProperties,
		public linkedFolder: string | null,
		children: IBaseChild[],
	) {
		this.container = new Container(children);
		children.forEach(p => p.parent = this);
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
		return this.volume / 100;
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

	// TODO: Sub-folders should be converted to groups.
	/** Adds Sounds to and/or removes them from the specified Soundboard as necessary
	 * to sync them with its linked folder. */
	async syncSounds(): Promise<void> {
		if (!this.linkedFolder) return;
		await Utils.assertAccessibleDirectory(this.linkedFolder);
		const files = await fs.readdir(this.linkedFolder);

		// Loop through files and add unexisting sounds
		for (let i = 0; i < files.length; i++) {
			const file = files[i]!;
			const soundPath = path.join(this.linkedFolder, file);
			if (!Sound.isValidSoundFile(soundPath)) return;
			const soundWithPath = this.container.findChildrenRecursive(
				p => !isIContainer(p) && (p as IDirectPlayable & IBaseChild).getAudioPath() == soundPath
			)[0];
			const stat = await fs.stat(soundPath);
			if (!soundWithPath && stat.isFile()) {
				const info = new BaseProperties(randomUUID(), Utils.getNameFromFile(soundPath), 100, []);
				const s = new Sound(info, soundPath);
				this.container.addChild(s);
			}
		}

		// Loop through existing sounds and remove those without a file
		if (this.container.getChildren().length > 0) {
			const playables = this.container.findChildrenRecursive(
				c => {
					if (isIContainer(c)) return false;
					const p = c as IDirectPlayable & IBaseChild;
					const path = p.getAudioPath();
					if (typeof path === "number") return false;
					return files.includes(path);
				}
			);
			playables.forEach(p => p.parent?.removeChild(p));
		}
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
}

export function isSoundboard(obj: object): obj is Soundboard {
	return isIBase(obj) && isIContainer(obj) && "linkedFolder" in obj;
}

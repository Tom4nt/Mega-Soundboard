import { promises as fs } from "fs";
import path = require("path");
import { tryGetValue } from "../../../shared/sharedUtils";
import Utils, { convertPlayables } from "../../utils/utils";
import { BaseProperties } from "./baseProperties";
import { Container } from "./container";
import { IPlayable, JSONObject, IPlayableContainer } from "./interfaces";
import { Sound } from "./sound";
import { randomUUID } from "crypto";
import { ISoundboardData } from "../../../shared/models/dataInterfaces";

export class Soundboard implements IPlayableContainer {
	constructor(
		private readonly baseProperties: BaseProperties,
		public linkedFolder: string | null,
		playables: IPlayable[],
	) {
		this.container = new Container(playables);
		this.uuid = baseProperties.uuid;
		this.name = baseProperties.name;
		this.keys = baseProperties.keys;
		this.volume = baseProperties.volume;
	}

	readonly isContainer = true;
	readonly isSoundboard = true;
	readonly isSound = false;
	readonly isGroup = false;

	private readonly container: Container;
	readonly uuid: string;
	parent: IPlayableContainer | null = null;
	name: string;
	keys: number[];
	volume: number;

	getAudioPath(): string {
		const playables = this.getPlayables();
		const index = Math.floor(Math.random() * playables.length);
		return playables[index]!.getAudioPath();
	}

	copy(): IPlayable {
		return Soundboard.convert(this.getSavable());
	}

	getPlayables(): readonly IPlayable[] {
		return this.container.getPlayables();
	}

	addPlayable(playable: IPlayable, index?: number | undefined): void {
		playable.parent = this;
		this.container.addPlayable(playable, index);
	}

	removePlayable(playable: IPlayable): void {
		playable.parent = null;
		this.container.removePlayable(playable);
	}

	containsPlayable(playable: IPlayable): boolean {
		return this.container.containsPlayable(playable);
	}

	findPlayablesRecursive(predicate: (p: IPlayable) => boolean): readonly IPlayable[] {
		return this.container.findPlayablesRecursive(predicate);
	}

	sortPlayables(): void {
		this.container.sortPlayables();
	}

	getFinalVolume(): number {
		return this.volume;
	}

	compare(other: IPlayable): number {
		return this.name.localeCompare(other.name);
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
			sounds: this.container.getPlayables().map(p => p.getSavable()),
		};
	}

	edit(data: ISoundboardData): void {
		this.name = data.name;
		this.keys.length = 0;
		this.keys.push(...data.keys);
		this.volume = data.volume;
		this.linkedFolder = data.linkedFolder;
	}

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
			const soundWithPath = this.container.findPlayablesRecursive(
				p => !p.isContainer && p.getAudioPath() == soundPath
			)[0];
			const stat = await fs.stat(soundPath);
			if (!soundWithPath && stat.isFile()) {
				const info = new BaseProperties(randomUUID(), Utils.getNameFromFile(soundPath), 100, []);
				const s = new Sound(info, soundPath);
				this.container.addPlayable(s);
			}
		}

		// Loop through existing sounds and remove those without a file
		if (this.container.getPlayables().length > 0) {
			const playables = this.container.findPlayablesRecursive(
				p => !p.isContainer && files.includes(p.getAudioPath())
			);
			playables.forEach(p => p.parent?.removePlayable(p));
		}
	}

	asData(): ISoundboardData {
		return {
			keys: this.baseProperties.keys,
			name: this.baseProperties.name,
			linkedFolder: this.linkedFolder,
			uuid: this.baseProperties.uuid,
			volume: this.baseProperties.volume,
			hasSounds: this.container.getPlayables().length > 0,
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

		let playables: IPlayable[] = [];
		const playablesTry = tryGetValue(data, ["playables", "sounds"], x => Array.isArray(x));
		if (playablesTry) {
			playables = convertPlayables(playablesTry as []);
		}

		return new Soundboard(commonInfo, linkedFolder, playables);
	}
}

import * as p from "path";
import { randomUUID } from "crypto";
import { tryGetValue } from "../../../shared/sharedUtils";
import { BaseProperties } from "./baseProperties";
import { IPlayable, IPlayableContainer, JSONObject } from "./interfaces";
import Utils from "../../utils/utils";
import { validSoundExts } from "../../../shared/sharedUtils";
import { ISoundData } from "../../../shared/models/dataInterfaces";

export class Sound implements IPlayable {
	constructor(
		baseProperties: BaseProperties,
		public path: string,
	) {
		this.uuid = baseProperties.uuid;
		this.name = baseProperties.name;
		this.keys = baseProperties.keys;
		this.volume = baseProperties.volume;
	}

	readonly isSound = true;
	readonly isGroup = false;
	readonly isContainer = false;
	readonly isSoundboard = false;

	readonly uuid: string;
	name: string;
	keys: number[];
	volume: number;
	readonly parent: IPlayableContainer | null = null;

	getAudioPath(): string {
		return this.path;
	}

	getFinalVolume(): number {
		return ((this.parent?.getFinalVolume() ?? 0) / 100) * (this.volume / 100);
	}

	getSavable(): JSONObject {
		return {
			name: this.name,
			volume: this.volume,
			keys: this.keys,
			path: this.path,
		};
	}

	copy(): Sound {
		return Sound.convert(this.getSavable());
	}

	compare(other: IPlayable): number {
		return this.name.localeCompare(other.name);
	}

	edit(data: ISoundData): void {
		this.name = data.name;
		this.volume = data.volume;
		this.path = data.path;

		this.keys.length = 0;
		this.keys.push(...data.keys);
	}

	asData(): ISoundData {
		return {
			uuid: this.uuid,
			name: this.name,
			path: this.path,
			keys: this.keys,
			volume: this.volume,
			isGroup: false,
		};
	}

	static fromData(data: ISoundData): Sound {
		return new Sound(BaseProperties.fromData(data), data.path);
	}

	static convert(data: JSONObject): Sound {
		const info = BaseProperties.convert(data);

		let path: string = "?";
		const pathRes = tryGetValue(data, ["path", "url"], v => typeof v === "string");
		if (pathRes) path = pathRes as string;

		return new Sound(info, path);
	}

	static getNewSoundsFromPaths(paths: string[]): Sound[] {
		return Array.from(this.iterateSoundsFromPaths(paths));
	}

	static *iterateSoundsFromPaths(paths: string[]): Generator<Sound> {
		for (const path of paths) {
			const info = new BaseProperties(randomUUID(), Utils.getNameFromFile(path), 100, []);
			yield new Sound(info, path);
		}
	}

	static isValidSoundFile(path: string): boolean {
		let ext = p.extname(path);
		if (ext.startsWith(".")) ext = ext.substring(1);
		return validSoundExts.includes(ext);
	}

	static getValidSoundPaths(paths: string[]): string[] {
		return paths.filter(x => this.isValidSoundFile(x));
	}
}

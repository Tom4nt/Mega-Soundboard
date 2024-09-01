import * as p from "path";
import { randomUUID } from "crypto";
import { tryGetValue } from "../../../shared/sharedUtils";
import { BaseProperties } from "./baseProperties";
import { IBase, IBaseChild, IBaseContainer, IDirectPlayable, IDirectPlayableChild, JSONObject } from "./interfaces";
import Utils from "../../utils/utils";
import { validSoundExts } from "../../../shared/sharedUtils";
import { ISoundData } from "../../../shared/models/dataInterfaces";

export class Sound implements IBaseChild, IDirectPlayable {
	constructor(
		baseProperties: BaseProperties,
		public path: string,
	) {
		this.uuid = baseProperties.uuid;
		this.name = baseProperties.name;
		this.keys = baseProperties.keys;
		this.volume = baseProperties.volume;
	}

	readonly hasParent = true;
	readonly isContainer = false;
	readonly uuid: string;
	name: string;
	keys: number[];
	volume: number;
	readonly parent?: IBaseContainer;

	getUuid(): string {
		return this.uuid;
	}

	getName(): string {
		return this.name;
	}

	getKeys(): number[] {
		return this.keys;
	}

	getAudioPath(): string {
		return this.path;
	}

	getVolume(): number {
		return (this.parent?.getVolume() ?? 0) * this.volume;
	}

	getSavable(): JSONObject {
		return {
			name: this.name,
			volume: this.volume,
			keys: this.keys,
			path: this.path,
		};
	}

	getDirectPlayables(): IDirectPlayableChild[] {
		return [this];
	}

	copy(): Sound {
		return Sound.convert(this.getSavable());
	}

	compare(other: IBase): number {
		return this.name.localeCompare(other.getName());
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
			isGroup: false
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
			const info = new BaseProperties(randomUUID(), Utils.getNameFromFile(path), 1, []);
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

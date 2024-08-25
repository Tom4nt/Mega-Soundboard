import { randomUUID } from "crypto";
import Keys from "../../../shared/keys";
import { tryGetValue } from "../../../shared/sharedUtils";
import { JSONObject } from "./interfaces";
import { IBaseData } from "../../../shared/models/dataInterfaces";

export class BaseProperties {
	constructor(
		public readonly uuid: string,
		public name: string,
		public volume: number,
		public readonly keys: number[],
	) { }

	getSavable(): JSONObject {
		return {
			name: this.name,
			keys: this.keys,
			volume: this.volume,
		};
	}

	static fromData(data: IBaseData): BaseProperties {
		return new BaseProperties(data.uuid, data.name, data.volume, data.keys);
	}

	static convert(data: JSONObject): BaseProperties {
		// Defaults
		let name = "¯\\_(ツ)_/¯";
		let volume = 1;
		let keys: number[] = [];

		if (typeof data["name"] === "string") name = data["name"];
		if (typeof data["volume"] === "number") {
			volume = data["volume"] > 1 ? data["volume"] / 100 : data["volume"];
		}

		const keysRes = tryGetValue(data, ["keys", "shortcut"], v => Keys.isKeys(v));
		if (keysRes) keys = data["keys"] as number[];

		return new BaseProperties(randomUUID(), name, volume, keys);
	}
}

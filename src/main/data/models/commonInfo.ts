import { randomUUID } from "crypto";
import Keys from "../../../shared/keys";
import { tryGetValue } from "../../../shared/sharedUtils";
import { ICommon, JSONObject } from "./interfaces";

export class CommonInfo implements ICommon {
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

    compare(other: ICommon): number {
        return this.name.localeCompare(other.name);
    }

    static convert(data: JSONObject): CommonInfo {
        // Defaults
        let name = "¯\\_(ツ)_/¯";
        let volume = 100;
        let keys: number[] = [];

        if (typeof data["name"] === "string") name = data["name"];
        if (typeof data["volume"] === "number") volume = data["volume"];

        const keysRes = tryGetValue(data, ["keys", "shortcut"], v => Keys.isKeys(v));
        if (keysRes) keys = data["keys"] as number[];

        return new CommonInfo(randomUUID(), name, volume, keys);
    }
}

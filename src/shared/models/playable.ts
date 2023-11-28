import Keys from "../keys";
import { tryGetValue } from "../sharedUtils";
import { convertGroup, copyGroup, getSavableGroup, isGroup } from "./group";
import { convertSound, copySound, getSavableSound, isSound } from "./sound";

export type Playable = {
    uuid: string,
    parentUuid: string,
    name: string,
    volume: number,
    keys: number[],
};

// ---

export function compare(a: Playable, b: Playable): number {
    return a.name.localeCompare(b.name);
}

export function equals(from: Playable, to: Playable): boolean {
    return from.uuid == to.uuid;
}

export function getSavable(playable: Playable): { [key: string]: unknown } {
    if (isSound(playable)) {
        return getSavableSound(playable);
    } else if (isGroup(playable)) {
        return getSavableGroup(playable);
    }
    return {};
}

export function getSavablePlayable(p: Playable): { [key: string]: unknown } {
    return {
        name: p.name,
        keys: p.keys,
        volume: p.volume,
    };
}

export function copy(p: Playable, generateUuid: () => string, soundboardUuid: string): Playable {
    if (isSound(p)) return copySound(p, generateUuid(), soundboardUuid);
    if (isGroup(p)) return copyGroup(p, generateUuid, soundboardUuid);
    throw Error("Cannot copy invalid Playable.");
}

export function convert(
    data: { [key: string]: unknown }, generateUuid: () => string, soundboardUuid: string
): Playable {
    if (isSound(data)) {
        return convertSound(data, generateUuid(), soundboardUuid);
    } else {
        return convertGroup(data, generateUuid, soundboardUuid);
    }
}

export function convertPlayable(
    data: { [key: string]: unknown }, uuid: string, parentUuid: string
): Playable {
    // Defaults
    let name = "¯\\_(ツ)_/¯";
    let volume = 100;
    let keys: number[] = [];

    if (typeof data["name"] === "string") name = data["name"];
    if (typeof data["volume"] === "number") volume = data["volume"];

    const keysRes = tryGetValue(data, ["keys", "shortcut"], v => Keys.isKeys(v));
    if (keysRes) keys = data["keys"] as number[];

    return { uuid, name, keys, parentUuid, volume, };
}

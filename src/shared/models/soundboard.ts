import Keys from "../keys";
import { convertPlayables, tryGetValue } from "../sharedUtils";
import { Playable, getSavable } from "./playable";

// All functions must be static so instances can be passed between processes.
export type Soundboard = {
    uuid: string,
    name: string,
    keys: number[],
    volume: number,
    linkedFolder: string | null,
    playables: Playable[],
}

export function equals(from: Soundboard, to: Soundboard): boolean {
    return from.uuid === to.uuid;
}

export function getDefault(uuid: string, name: string): Soundboard {
    return {
        uuid,
        name,
        keys: [],
        linkedFolder: null,
        playables: [],
        volume: 100,
    };
}

export function getSavableSoundboard(soundboard: Soundboard): { [key: string]: unknown } {
    return {
        name: soundboard.name,
        keys: soundboard.keys,
        volume: soundboard.volume,
        linkedFolder: soundboard.linkedFolder,
        playables: soundboard.playables.map(x => getSavable(x)),
    };
}

export function convertSoundboard(data: { [key: string]: unknown }, generateUuid: () => string): Soundboard {
    let name = "¯\\_(ツ)_/¯";
    if (typeof data["name"] === "string") name = data["name"];

    let keys: number[] = [];
    if (Keys.isKeys(data["keys"])) keys = data["keys"];

    let volume = 100;
    if (typeof data["volume"] === "number") volume = data["volume"];

    let linkedFolder: string | null = null;
    if (typeof data["linkedFolder"] === "string") linkedFolder = data["linkedFolder"];

    const uuid = generateUuid();

    let playables: Playable[] = [];
    const playablesTry = tryGetValue(data, ["playables", "sounds"], x => Array.isArray(x));
    if (playablesTry) {
        playables = convertPlayables(playablesTry as [], uuid, generateUuid);
    }

    return { uuid, name, keys, volume, linkedFolder, playables, };
}

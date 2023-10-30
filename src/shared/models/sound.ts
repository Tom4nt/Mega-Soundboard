import { tryGetValue } from "../sharedUtils";
import { Playable, convertPlayable, getSavablePlayable } from "./playable";

// All functions must be static so instances can be passed between processes.
export type Sound = Playable & {
    path: string,
};

export function copySound(s: Sound, uuid: string, soundboardUuid: string): Sound {
    return convertSound(getSavableSound(s), uuid, soundboardUuid);
}

export function getSavableSound(s: Sound): { [key: string]: unknown } {
    return {
        ...getSavablePlayable(s),
        path: s.path,
    };
}

export function convertSound(
    data: { [key: string]: unknown }, uuid: string, soundboardUuid: string
): Sound {
    const source = convertPlayable(data, uuid, soundboardUuid);

    let path: string = "?";
    const pathRes = tryGetValue(data, ["path", "url"], v => typeof v === "string");
    if (pathRes) path = pathRes as string;

    return { ...source, path, };
}

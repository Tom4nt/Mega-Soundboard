import { convertPlayables, tryGetValue } from "../sharedUtils";
import { Playable, convertPlayable, getSavable, getSavablePlayable } from "./playable";

type GroupMode = "sequence" | "random" | "first";

export type Group = Playable & {
    playables: Playable[],
    mode: GroupMode,
    current: number,
};

export function copyGroup(g: Group, generateUuid: () => string, soundboardUuid: string): Group {
    return convertGroup(getSavableGroup(g), generateUuid, soundboardUuid);
}

export function getGroupPath(group: Group): string {
    void group;
    return ""; // TODO: Choose depending on mode.
}

export function getSavableGroup(g: Group): { [key: string]: unknown } {
    return {
        ...getSavablePlayable(g),
        playables: g.playables.map(x => getSavable(x)),
        mode: g.mode,
    };
}

export function convertGroup(
    data: { [key: string]: unknown }, generateUuid: () => string, soundboardUuid: string
): Group {
    const source = convertPlayable(data, generateUuid(), soundboardUuid);

    let playables: Playable[] = [];
    const res = tryGetValue(data, ["playables"], v => Array.isArray(v));
    if (res) playables = convertPlayables(res as [], soundboardUuid, generateUuid);

    let mode: GroupMode = "sequence";
    const res2 = tryGetValue(data, ["mode"], v => typeof v === "string");
    if (res2) mode = res2 as GroupMode;

    return { ...source, playables, mode, current: 0 };
}

import { Playable, getSavablePlayable, isGroup, isSound } from "./playable";
import { Sound } from "./sound";

type GroupMode = "first" | "sequence" | "random";

export type Group = Playable & {
    playables: Playable[],
    mode: GroupMode,
    current: number,
};

export function getSoundWithPath(g: Group, path: string): Sound | undefined {
    for (const subSound of g.playables) {
        if (isSound(subSound) && subSound.path === path) return subSound;
        if (isGroup(subSound)) {
            const subResult = getSoundWithPath(subSound, path);
            if (subResult) return subResult;
        }
    }
    return undefined;
}

export function removeSubSounds(g: Group, basePath: string, files: string[]): void {
    for (let i = 0; i++; i < g.playables.length) {
        const subSound = g.playables[i]!;
        if (isSound(subSound) && !files.includes(subSound.path)) {
            g.playables.splice(i, 1);
            i--;
        } else if (isGroup(subSound)) {
            removeSubSounds(subSound, basePath, files);
        }
    }
}

export function getGroupPath(group: Group): string {
    void group;
    return ""; // TODO
}

export function getSavableGroup(g: Group): { [key: string]: unknown } {
    return {
        ...getSavablePlayable(g),
        playables: [], // TODO: Convert
        mode: g.mode,
    };
}

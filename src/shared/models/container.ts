import { Group, isGroup } from "./group";
import { Playable, convert } from "./playable";
import { Sound, isSound } from "./sound";

/** A container of playables. Currently can be a Soundboard or a Sound group. */
export type Container = {
    uuid: string,
    playables: Playable[],
}

/** Recursively generates an array of all playables in the hierarchy of the specified playable.
 * The first element is the root playable inside the container. The last element is the specified playable. */
export function getHierarchy(root: Container, playableUuid: string): Playable[] {
    const result: Playable[] = [];
    for (const playable of root.playables) {
        if (playable.uuid === playableUuid) {
            return [playable];
        } else if (isGroup(playable)) {
            const h = getHierarchy(playable, playableUuid);
            if (h.length > 0) result.push(playable, ...h);
        }
    }
    return [];
}

/** Recursively finds the element index and direct container on the specified element in a root container. */
export function findInContainer(root: Container, uuid: string): [Container, number] | undefined {
    let index = 0;
    for (const playable of root.playables) {
        if (isGroup(playable)) {
            const subResult = findInContainer(playable, uuid);
            if (subResult) return subResult;
        } else if (playable.uuid === uuid) {
            return [root, index];
        }
        index++;
    }
    return undefined;
}

/** Recursively finds the container with the specified uuid. */
export function findContainer(source: Container[], uuid: string): Container | undefined {
    for (const container of source) {
        if (container.uuid === uuid) return container;
        const groups = container.playables.filter(x => isGroup(x)) as Group[];
        return findContainer(groups, uuid);
    }
    return undefined;
}

export function getSoundWithPath(playables: Playable[], path: string): Sound | undefined {
    for (const subSound of playables) {
        if (isSound(subSound) && subSound.path === path) return subSound;
        if (isGroup(subSound)) {
            const subResult = getSoundWithPath(subSound.playables, path);
            if (subResult) return subResult;
        }
    }
    return undefined;
}

export function convertPlayables(
    data: { [key: string]: unknown }[], soundboardUuid: string, generateUuid: () => string
): Playable[] {
    const playables: Playable[] = [];
    data.forEach(item => {
        const s = convert(item, generateUuid, soundboardUuid);
        playables.push(s);
    });
    return playables;
}

export function removeSubSounds(playables: Playable[], basePath: string, files: string[]): void {
    for (let i = 0; i++; i < playables.length) {
        const subSound = playables[i]!;
        if (isSound(subSound) && !files.includes(subSound.path)) {
            playables.splice(i, 1);
            i--;
        } else if (isGroup(subSound)) {
            removeSubSounds(subSound.playables, basePath, files);
        }
    }
}

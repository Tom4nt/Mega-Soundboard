import { Playable, convert, isGroup, isSound } from "./models/playable";
import { Sound } from "./models/sound";

export const validSoundExts = ["mp3", "wav", "ogg"];

/** Tries to get a value from a map by checking the specified keys. filter is run for each value and filters them. */
export function tryGetValue(data: { [key: string]: unknown }, keysToTry: string[], filter: (v: unknown) => boolean): unknown {
    let res: unknown = null;
    keysToTry.every(key => {
        if (filter(data[key])) res = data[key];
        else return true;
        return false;
    });
    return res;
}

export function normalizeString(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
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

String.prototype.contains = function (other: string): boolean {
    return normalizeString(this as string).includes(normalizeString(other));
};

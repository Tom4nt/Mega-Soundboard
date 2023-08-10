export const validSoundExts = ["mp3", "wav", "ogg"];

/** Tries to get a value from a map by checking the specified keys. filter is run for each value and filters them. */
export function tryGetValue(data: Map<string, unknown>, keysToTry: string[], filter: (v: unknown) => boolean): unknown {
    let res: unknown = null;
    keysToTry.every(key => {
        if (filter(data.get(key))) res = data.get(key);
        else return true;
        return false;
    });
    return res;
}

export function objectToMap(object: object): Map<string, unknown> {
    const entries = Object.entries(object);
    return new Map<string, unknown>(entries);
}

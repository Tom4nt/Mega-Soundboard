export const validSoundExts = ["mp3", "wav", "ogg"];
export const uiSounds = ["on", "off", "error"] as const;

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

export function stringContains(str: string, other: string): boolean {
	return normalizeString(str).includes(normalizeString(other));
}

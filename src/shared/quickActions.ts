export const actionNames = [
	"stopSounds",
	"playRandomSound",
	"toggleKeybinds",
	"toggleSoundOverlap",
	"toggleSoundLooping",
] as const;

export type ActionName = (typeof actionNames)[number];

type ActionDefaults = { [P in ActionName]: boolean | null; }
type ActionNames = { [P in ActionName]: string; }

export function isAction(name: string): name is ActionName {
	return actionNames.includes(name as ActionName);
}

export const actionFriendlyNames: ActionNames = {
	stopSounds: "Stop sounds",
	playRandomSound: "Play random sound",
	toggleKeybinds: "Keybinds",
	toggleSoundLooping: "Loop sounds",
	toggleSoundOverlap: "Overlap sounds"
};

export const actionDefaults: ActionDefaults = {
	stopSounds: null,
	playRandomSound: null,
	toggleKeybinds: true,
	toggleSoundLooping: false,
	toggleSoundOverlap: true,
};

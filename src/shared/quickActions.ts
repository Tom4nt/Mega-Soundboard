export const actionNames = [
    "stopSounds",
    "playRandomSound",
    "toggleKeybinds",
    "toggleSoundOverlap",
    "toggleSoundLooping",
] as const;

export type ActionName = (typeof actionNames)[number];

interface Action {
    name: string;
    default: boolean | null;
}

type Actions = {
    [P in ActionName]: Action;
}

export function isAction(name: string): name is ActionName {
    return actionNames.includes(name as ActionName);
}

export const actions: Actions = {
    stopSounds: {
        name: "Stop sounds",
        default: null,
    },
    playRandomSound: {
        name: "Play random sound",
        default: null,
    },
    toggleKeybinds: {
        name: "Keybinds usable",
        default: true,
    },
    toggleSoundOverlap: {
        name: "Overlap sounds",
        default: true,
    },
    toggleSoundLooping: {
        name: "Loop sounds",
        default: false,
    }
};

export enum UISoundPath {
    ON = "res/audio/on.wav",
    OFF = "res/audio/off.wav",
    ERROR = "res/audio/error.wav"
}

export const sides = ["top", "bottom", "left", "right"] as const;
export type Side = typeof sides[number];
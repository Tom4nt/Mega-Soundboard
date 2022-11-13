export enum UISoundPath {
    ON = "audio/on.wav",
    OFF = "audio/off.wav",
    ERROR = "audio/error.wav"
}

export const sides = ["top", "bottom", "left", "right"] as const;
export type Side = typeof sides[number];

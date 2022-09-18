import Settings from "./models/settings";
import Sound from "./models/sound";
import Soundboard from "./models/soundboard";

export enum UISoundPath {
    ON = "res/audio/on.wav",
    OFF = "res/audio/off.wav",
    ERROR = "res/audio/error.wav"
}

export type Side = "top" | "bottom" | "left" | "right"

export {
    Settings,
    Sound,
    Soundboard,
};
import Data from "./models/Data";
import KeybindManager from "./models/KeybindManager";
import Keys from "./models/Keys";
import MS from "./models/MS";
import Settings from "./models/Settings";
import Sound from "./models/Sound";
import Soundboard from "./models/Soundboard";
import Utils from "./models/Utils";

export enum UISoundPath {
    ON = "res/audio/on.wav",
    OFF = "res/audio/off.wav",
    ERROR = "res/audio/error.wav"
}

export type Side = "top" | "bottom" | "left" | "right"

export {
    Data,
    KeybindManager,
    Keys,
    MS,
    Settings,
    Sound,
    Soundboard,
    Utils,
};
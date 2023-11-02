import { ExposedEvent } from "./events";
import {
    KeyRecordingArgs,
    NonOptional,
    PlayableAddedArgs,
    SoundboardAddedArgs,
    PlayableChangedArgs,
    UpdaterState,
    WindowState
} from "./interfaces";
import { Settings } from "./models";
import { Playable } from "./models/playable";
import { Soundboard } from "./models/soundboard";

class ConcreteEvents {
    onKeybindsStateChanged: ExposedEvent<boolean> | null = null;
    onOverlapSoundsStateChanged: ExposedEvent<boolean> | null = null;
    onLoopSoundsChanged: ExposedEvent<boolean> | null = null;
    onSettingsChanged: ExposedEvent<Settings> | null = null;
    onPlayableAdded: ExposedEvent<PlayableAddedArgs> | null = null;
    onPlayableChanged: ExposedEvent<PlayableChangedArgs> | null = null;
    onPlayableRemoved: ExposedEvent<Playable> | null = null;
    onSoundboardAdded: ExposedEvent<SoundboardAddedArgs> | null = null;
    onSoundboardChanged: ExposedEvent<Soundboard> | null = null;
    onSoundboardRemoved: ExposedEvent<Soundboard> | null = null;
    onSoundboardSorted: ExposedEvent<Soundboard> | null = null;
    onWindowStateChanged: ExposedEvent<WindowState> | null = null;
    onWindowFocusChanged: ExposedEvent<boolean> | null = null;
    onKeyRecordingProgress: ExposedEvent<KeyRecordingArgs> | null = null;
    onKeybindPressed: ExposedEvent<number[]> | null = null;
    onCurrentSoundboardChanged: ExposedEvent<Soundboard> | null = null;
    onMinToTrayChanged: ExposedEvent<boolean> | null = null;
    onUpdateStateChanged: ExposedEvent<UpdaterState> | null = null;
    onPlayRequested: ExposedEvent<Playable> | null = null;
    onStopAllSounds: ExposedEvent<void> | null = null;
    onZoomFactorChanged: ExposedEvent<number> | null = null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ExtractExposedEventType<T> = T extends ExposedEvent<infer T> ? T : never;
type MapEventType<T> = { [P in keyof T]: ExtractExposedEventType<T[P]> }

export type Events = NonOptional<ConcreteEvents>
export type EventsMap = MapEventType<Events>;
export const eventsKeys = Object.keys(new ConcreteEvents) as (keyof Events)[];

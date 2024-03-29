import { ExposedEvent } from "./events";
import {
    KeyRecordingArgs,
    NonOptional,
    SoundAddedArgs,
    SoundboardAddedArgs,
    SoundChangedArgs,
    UpdaterState,
    WindowState
} from "./interfaces";
import { Settings, Sound, Soundboard } from "./models";

class ConcreteEvents {
    onKeybindsStateChanged: ExposedEvent<boolean> | null = null;
    onOverlapSoundsStateChanged: ExposedEvent<boolean> | null = null;
    onLoopSoundsChanged: ExposedEvent<boolean> | null = null;
    onSettingsChanged: ExposedEvent<Settings> | null = null;
    onSoundAdded: ExposedEvent<SoundAddedArgs> | null = null;
    onSoundChanged: ExposedEvent<SoundChangedArgs> | null = null;
    onSoundRemoved: ExposedEvent<Sound> | null = null;
    onSoundboardAdded: ExposedEvent<SoundboardAddedArgs> | null = null;
    onSoundboardChanged: ExposedEvent<Soundboard> | null = null;
    onSoundboardRemoved: ExposedEvent<Soundboard> | null = null;
    onSoundboardSoundsSorted: ExposedEvent<Soundboard> | null = null;
    onWindowStateChanged: ExposedEvent<WindowState> | null = null;
    onWindowFocusChanged: ExposedEvent<boolean> | null = null;
    onKeyRecordingProgress: ExposedEvent<KeyRecordingArgs> | null = null;
    onKeybindPressed: ExposedEvent<number[]> | null = null;
    onCurrentSoundboardChanged: ExposedEvent<Soundboard> | null = null;
    onMinToTrayChanged: ExposedEvent<boolean> | null = null;
    onUpdateStateChanged: ExposedEvent<UpdaterState> | null = null;
    onSoundPlayRequested: ExposedEvent<Sound> | null = null;
    onStopAllSounds: ExposedEvent<void> | null = null;
    onZoomFactorChanged: ExposedEvent<number> | null = null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ExtractExposedEventType<T> = T extends ExposedEvent<infer T> ? T : never;
type MapEventType<T> = { [P in keyof T]: ExtractExposedEventType<T[P]> }

export type Events = NonOptional<ConcreteEvents>
export type EventsMap = MapEventType<Events>;
export const eventsKeys = Object.keys(new ConcreteEvents) as (keyof Events)[];

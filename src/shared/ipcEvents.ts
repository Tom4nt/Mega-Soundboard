import { ExposedEvent } from "./events";
import {
    ContainerSortedArgs,
    KeyRecordingArgs,
    NonOptional,
    PlayableAddedArgs,
    SoundboardAddedArgs,
    UpdaterState,
    WindowState
} from "./interfaces";
import { Settings } from "./models";
import { IPlayableData, ISoundboardData, PlayData } from "./models/data";

class ConcreteEvents {
    onKeybindsStateChanged: ExposedEvent<boolean> | null = null;
    onOverlapSoundsStateChanged: ExposedEvent<boolean> | null = null;
    onLoopSoundsChanged: ExposedEvent<boolean> | null = null;
    onSettingsChanged: ExposedEvent<Settings> | null = null;
    onPlayableAdded: ExposedEvent<PlayableAddedArgs> | null = null;
    onPlayableChanged: ExposedEvent<IPlayableData> | null = null;
    onPlayableRemoved: ExposedEvent<IPlayableData> | null = null;
    onSoundboardAdded: ExposedEvent<SoundboardAddedArgs> | null = null;
    onSoundboardChanged: ExposedEvent<ISoundboardData> | null = null;
    onSoundboardRemoved: ExposedEvent<ISoundboardData> | null = null;
    onContainerSorted: ExposedEvent<ContainerSortedArgs> | null = null;
    onWindowStateChanged: ExposedEvent<WindowState> | null = null;
    onWindowFocusChanged: ExposedEvent<boolean> | null = null;
    onKeyRecordingProgress: ExposedEvent<KeyRecordingArgs> | null = null;
    onKeybindPressed: ExposedEvent<number[]> | null = null;
    onCurrentSoundboardChanged: ExposedEvent<ISoundboardData> | null = null;
    onMinToTrayChanged: ExposedEvent<boolean> | null = null;
    onUpdateStateChanged: ExposedEvent<UpdaterState> | null = null;
    onPlayRequested: ExposedEvent<PlayData> | null = null;
    onStopRequested: ExposedEvent<string> | null = null;
    onStopAllSounds: ExposedEvent<void> | null = null;
    onZoomFactorChanged: ExposedEvent<number> | null = null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ExtractExposedEventType<T> = T extends ExposedEvent<infer T> ? T : never;
type MapEventType<T> = { [P in keyof T]: ExtractExposedEventType<T[P]> }

export type Events = NonOptional<ConcreteEvents>
export type EventsMap = MapEventType<Events>;
export const eventsKeys = Object.keys(new ConcreteEvents) as (keyof Events)[];

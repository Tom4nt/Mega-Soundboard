import { ExposedEvent } from "./events";
import { NonOptional, SoundAddedArgs, SoundboardAddedArgs, SoundChangedArgs, WindowState } from "./interfaces";
import { Settings, Sound, Soundboard } from "./models";

class ConcreteEvents {
    onDevicesChanged: ExposedEvent<Settings> | null = null;
    onKeybindsStateChanged: ExposedEvent<boolean> | null = null;
    onOverlapSoundsStateChanged: ExposedEvent<boolean> | null = null;
    onSoundAdded: ExposedEvent<SoundAddedArgs> | null = null;
    onSoundChanged: ExposedEvent<SoundChangedArgs> | null = null;
    onSoundRemoved: ExposedEvent<Sound> | null = null;
    onSoundboardAdded: ExposedEvent<SoundboardAddedArgs> | null = null;
    onSoundboardChanged: ExposedEvent<Soundboard> | null = null;
    onSoundboardRemoved: ExposedEvent<Soundboard> | null = null;
    onWindowStateChanged: ExposedEvent<WindowState> | null = null;
    onWindowFocusChanged: ExposedEvent<boolean> | null = null;
    onKeyRecordingProgress: ExposedEvent<number[]> | null = null;
    onCurrentSoundboardChanged: ExposedEvent<Soundboard> | null = null;
    onMinToTrayChanged: ExposedEvent<boolean> | null = null;
    onUpdateAvailable: ExposedEvent<void> | null = null;
    onUpdateProgress: ExposedEvent<number> | null = null;
    onUpdateReady: ExposedEvent<void> | null = null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ExtractExposedEventType<T> = T extends ExposedEvent<infer T> ? T : never;
type MapEventType<T> = { [P in keyof T]: ExtractExposedEventType<T[P]> }

export type Events = NonOptional<ConcreteEvents>
export type EventsMap = MapEventType<Events>;
export const eventsKeys = Object.keys(new ConcreteEvents) as (keyof Events)[];

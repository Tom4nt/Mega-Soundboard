import { ExposedEvent } from "./events";
import {
	ContainerSortedArgs,
	IPlayArgs,
	KeyRecordingArgs,
	NonOptional,
	PlayableAddedArgs,
	SoundboardAddedArgs,
	UpdaterState,
	WindowState
} from "./interfaces";
import { IPlayableData, ISettingsData, ISoundboardData, PlayData, UuidHierarchyData } from "./models/dataInterfaces";

class ConcreteEvents {
	keybindsStateChanged: ExposedEvent<boolean> | null = null;
	overlapSoundsStateChanged: ExposedEvent<boolean> | null = null;
	loopSoundsChanged: ExposedEvent<boolean> | null = null;
	settingsChanged: ExposedEvent<ISettingsData> | null = null;
	playableAdded: ExposedEvent<PlayableAddedArgs> | null = null;
	playablesAdded: ExposedEvent<PlayableAddedArgs[]> | null = null;
	playableChanged: ExposedEvent<IPlayableData> | null = null;
	playableRemoved: ExposedEvent<IPlayableData> | null = null;
	soundboardAdded: ExposedEvent<SoundboardAddedArgs> | null = null;
	soundboardChanged: ExposedEvent<ISoundboardData> | null = null;
	soundboardRemoved: ExposedEvent<ISoundboardData> | null = null;
	containerSorted: ExposedEvent<ContainerSortedArgs> | null = null;
	windowStateChanged: ExposedEvent<WindowState> | null = null;
	windowFocusChanged: ExposedEvent<boolean> | null = null;
	keyRecordingProgress: ExposedEvent<KeyRecordingArgs> | null = null;
	keybindPressed: ExposedEvent<number[]> | null = null;
	currentSoundboardChanged: ExposedEvent<ISoundboardData> | null = null;
	minToTrayChanged: ExposedEvent<boolean> | null = null;
	updateStateChanged: ExposedEvent<UpdaterState> | null = null;
	zoomFactorChanged: ExposedEvent<number> | null = null;

	// Audio Manager
	play: ExposedEvent<IPlayArgs> | null = null;
	stop: ExposedEvent<PlayData> | null = null;
	playing: ExposedEvent<UuidHierarchyData> | null = null; // TODO: Raise and listen to these
	notPlaying: ExposedEvent<UuidHierarchyData> | null = null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ExtractExposedEventType<T> = T extends ExposedEvent<infer T> ? T : never;
type MapEventType<T> = { [P in keyof T]: ExtractExposedEventType<T[P]> }

export type Events = NonOptional<ConcreteEvents>
export type EventsMap = MapEventType<Events>;
export const eventsKeys = Object.keys(new ConcreteEvents) as (keyof Events)[];

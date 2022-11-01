// import { ExposedEvent } from "../shared/events";
// import { IDevice, SoundAddedArgs, SoundChangedArgs, WindowState } from "../shared/interfaces";
import { Actions } from "../shared/ipcActions";
import { Events } from "../shared/ipcEvents";
// import { OptionalSettings, Settings, Sound, Soundboard } from "../shared/models";

declare global {
    interface HTMLMediaElement {
        setSinkId(sinkId: string): Promise<undefined>
    }

    interface Window {
        events: Events,
        actions: Actions,
        // functions: Functions,
    }

    // interface Events {
    //     onKeybindsStateChanged: ExposedEvent<boolean>,
    //     onOverlapSoundsStateChanged: ExposedEvent<boolean>,
    //     onDevicesChanged: ExposedEvent<IDevice[]>,
    //     onSoundAdded: ExposedEvent<SoundAddedArgs>,
    //     onSoundChanged: ExposedEvent<SoundChangedArgs>,
    //     onSoundRemoved: ExposedEvent<Sound>,
    //     onSoundboardAdded: ExposedEvent<Soundboard>,
    //     onSoundboardRemoved: ExposedEvent<Soundboard>,
    //     onWindowStateChanged: ExposedEvent<WindowState>,
    //     onKeyRecordingProgress: ExposedEvent<number[]>,
    //     onCurrentSoundboardChanged: ExposedEvent<Soundboard>,
    //     onMinToTrayChanged: ExposedEvent<boolean>,
    //     onUpdateAvailable: ExposedEvent<void>,
    //     onUpdateProgress: ExposedEvent<number>,
    //     onUpdateReady: ExposedEvent<void>,
    // }

    // interface Actions {
    //     toggleKeybindsState(): void,
    //     toggleOverlapSoundsState(): void,
    //     setMinimizeToTray(value: boolean): void,
    //     addSounds(sounds: Sound[], soundboardId: string, move: boolean, startIndex?: number): void,
    //     editSound(sound: Sound): void,
    //     deleteSound(soundId: string): void,
    //     addSoundboard(soundboard: Soundboard): void,
    //     deleteSoundboard(soundboardId: string): void,
    //     editSoundboard(soundboard: Soundboard): void,
    //     flagChangelogViewed(): void,
    //     moveSound(soundId: string, destinationSoundboardId: string, destinationIndex: number): void,
    //     moveSoundboard(soundboardId: string, destinationIndex: number): void,
    //     installUpdate(): void,
    //     setDeviceId(index: number, id: string): void,
    //     setDeviceVolume(index: number, volume: number): void,
    //     saveSettings(settings: OptionalSettings): void,
    //     minimize(): void,
    //     toggleMaximizedState(): void,
    //     close(): void,
    //     openRepo(): void,
    //     openBugReport(): void,
    //     stopKeyRecordingSession(id: string): void,
    //     setCurrentSoundboard(id: string): void,
    // }

    // interface Functions {
    //     getNewSoundsFromPaths(paths: string[]): Promise<Sound[]>,
    //     getNewSoundboard(): Promise<Soundboard>,
    //     browseSounds(): Promise<string[]>,
    //     browseFolder(): Promise<string>,
    //     getValidSoundPaths(paths: Iterator<string>): Promise<string[]>, // type === "audio/mpeg" || type === "audio/ogg" || type === "audio/wav"
    //     isPathValid(path: string, type: "sound" | "folder"): Promise<boolean>,
    //     getSoundboards(): Promise<Soundboard[]>,
    //     getInitialSelectedDevices(): Promise<MediaDeviceInfo[]>,
    //     shouldShowChangelog(): Promise<boolean>,
    //     getInitialSoundboardIndex(): Promise<number>,
    //     getNameFromPath(path: string): Promise<string>,
    //     getSettings(): Promise<Settings>,
    //     getVersion(): Promise<string>,
    //     getNewsHtml(): Promise<string>, // fs.readFile(__dirname + "/../../news.html", "utf-8");
    //     startKeyRecordingSession(): Promise<string>,
    // }
}

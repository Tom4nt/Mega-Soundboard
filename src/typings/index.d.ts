import { ExposedEvent } from "../shared/events";
import { IDevice } from "../shared/interfaces";
import { ISettings, Settings, Sound, Soundboard } from "../shared/models";

declare global {
    interface HTMLMediaElement {
        setSinkId(sinkId: string): Promise<undefined>
    }

    interface SoundAddedArgs {
        sound: Sound;
        index?: number;
    }

    interface Window {
        events: Events,
        actions: Actions,
        functions: Functions,
    }

    type WindowState = "minimized" | "restored" | "maximized";

    interface Events {
        onKeybindsStateChanged: ExposedEvent<boolean>,
        onOverlapSoundsStateChanged: ExposedEvent<boolean>,
        onDevicesChanged: ExposedEvent<IDevice[]>,
        onSoundAdded: ExposedEvent<SoundAddedArgs>,
        onSoundRemoved: ExposedEvent<Sound>,
        onStopAllSounds: ExposedEvent<void>,
        onWindowStateChanged: ExposedEvent<WindowState>,
        onKeyRecordingProgress: ExposedEvent<number[]>,
        onCurrentSoundboardChanged: ExposedEvent<Soundboard>,
    }

    interface Actions {
        toggleKeybinsState(): void,
        toggleOverlapSoundsState(): void,
        addSounds(sounds: Sound[], soundboardId: string, move: boolean, startIndex?: number): void,
        editSound(sound: Sound): void,
        deleteSound(soundId: string): void,
        addSoundboard(soundboard: Soundboard): void,
        deleteSoundboard(soundboardId: string): void,
        editSoundboard(soundboard: Soundboard): void,
        flagChangelogViewed(): void,
        moveSound(soundId: string, destinationSoundboardId: string, destinationIndex: number): void,
        moveSoundboard(soundboardId: string, destinationIndex: number): void,
        installUpdate(): void,
        setDeviceId(index: number, id: string): void,
        setDeviceVolume(index: number, volume: number): void,
        saveSettings(settings: ISettings): void,
        setMinimized(value: boolean): void,
        toggleMaximizeState(): void,
        close(): void,
        openRepo(): void, // "https://github.com/Tom4nt/Mega-Soundboard"
        openBugReport(): void, // "https://github.com/Tom4nt/Mega-Soundboard/issues/new?assignees=&labels=&template=bug_report.md",
        stopKeyRecordingSession(id: string): void,
        setCurrentSoundboard(id: string): void, // TODO: Call. Used for tracking folders for linked soundboards.
    }

    interface Functions {
        getNewUUID(): Promise<string>,
        getNewSoundsFromPaths(paths: string[]): Promise<Sound[]>,
        browseSounds(): Promise<string[]>,
        browseFolder(): Promise<string>,
        getValidSoundPaths(paths: Iterator<string>): Promise<string[]>, // type === "audio/mpeg" || type === "audio/ogg" || type === "audio/wav"
        isPathValid(path: string, type: "sound" | "folder"): Promise<boolean>,
        getSounds(soundboardId: string): Promise<Sound[]>,
        getSoundboards(): Promise<Soundboard[]>,
        getDevices(): Promise<MediaDeviceInfo[]>,
        getInitialSelectedDevices(): Promise<MediaDeviceInfo[]>,
        shouldShowChangelog(): Promise<boolean>,
        areKeysEnabled(): Promise<boolean>,
        isSoundOverlapEnabled(): Promise<boolean>,
        getInitialSoundboardIndex(): Promise<number>,
        getNameFromPath(path: string): Promise<string>,
        getSettings(): Promise<Settings>,
        getVersion(): Promise<string>,
        getNewsHtml(): Promise<string>, // fs.readFile(__dirname + "/../../news.html", "utf-8");
        startKeyRecordingSession(): Promise<string>,
    }
}

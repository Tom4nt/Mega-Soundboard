import { ExposedEvent } from "../shared/events";
import { IDevice } from "../shared/interfaces";
import { Sound, Soundboard } from "../shared/models";

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

    interface Events {
        onKeybindsStateChanged: ExposedEvent<boolean>,
        onOverlapSoundsStateChanged: ExposedEvent<boolean>,
        onDevicesChanged: ExposedEvent<IDevice[]>,
        onSoundAdded: ExposedEvent<SoundAddedArgs>,
        onSoundRemoved: ExposedEvent<Sound>,
        onStopAllSounds: ExposedEvent<void>,
        onSoundboardSelected: ExposedEvent<Soundboard>,
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
    }

    interface Functions {
        getNewUUID(): Promise<string>,
        getNewSoundsFromPaths(paths: string[]): Promise<Sound[]>,
        browseSounds(): Promise<string[]>,
        browseFolder(): Promise<string>,
        getValidSoundPaths(paths: Iterator<string>): Promise<string[]>, // type === "audio/mpeg" || type === "audio/ogg" || type === "audio/wav"
        isPathValid(path: string, type: "sound" | "soundboard"): Promise<boolean>,
        getSounds(soundboardId: string): Promise<Sound[]>,
        getSoundboards(): Promise<Soundboard[]>,
        getDevices(): Promise<MediaDeviceInfo[]>,
        getInitialSelectedDevices(): Promise<MediaDeviceInfo[]>,
        shouldShowChangelog(): Promise<boolean>,
        areKeysEnabled(): Promise<boolean>,
        isSoundOverlapEnabled(): Promise<boolean>,
        getInitialSoundboardIndex(): Promise<number>,
        getNameFromPath(path: string): Promise<string>,
    }
}

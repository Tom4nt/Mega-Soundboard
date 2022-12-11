import { NonOptional } from "./interfaces";
import { OptionalSettings, Settings, Sound, Soundboard } from "./models";

class ConcreteActions {
    minimize: (() => void) | null = null;
    toggleMaximizedState: (() => void) | null = null;
    close: (() => void) | null = null;

    notifyContentLoaded: (() => void) | null = null;

    addSounds: ((sounds: Sound[], soundboardId: string, move: boolean, startIndex?: number) => void) | null = null;
    editSound: ((sound: Sound) => void) | null = null;
    moveSound: ((soundId: string, destinationSoundboardId: string, destinationIndex: number) => void) | null = null;
    deleteSound: ((soundId: string) => void) | null = null;
    getNewSoundsFromPaths: ((paths: string[]) => Promise<Sound[]>) | null = null;
    getValidSoundPaths: ((paths: string[]) => Promise<string[]>) | null = null;

    getSoundboard: ((uuid: string) => Promise<Soundboard>) | null = null;
    getNewSoundboard: (() => Promise<Soundboard>) | null = null;
    addSoundboard: ((soundboard: Soundboard) => void) | null = null;
    moveSoundboard: ((soundboardId: string, destinationIndex: number) => void) | null = null;
    deleteSoundboard: ((soundboardId: string) => void) | null = null;
    editSoundboard: ((soundboard: Soundboard) => void) | null = null;
    setCurrentSoundboard: ((id: string) => void) | null = null;
    getSoundboards: (() => Promise<Soundboard[]>) | null = null;
    getInitialSoundboardIndex: (() => Promise<number>) | null = null;

    flagChangelogViewed: (() => void) | null = null;
    installUpdate: (() => void) | null = null;

    setMainDevice: ((id?: string, volume?: number) => void) | null = null;
    setSecondaryDevice: ((id?: string | null, volume?: number) => void) | null = null;

    getSettings: (() => Promise<Settings>) | null = null;
    saveSettings: ((settings: OptionalSettings) => void) | null = null;
    shouldShowChangelog: (() => Promise<boolean>) | null = null;
    toggleKeybindsState: (() => void) | null = null;
    toggleOverlapSoundsState: (() => void) | null = null;

    openRepo: (() => void) | null = null;
    openBugReport: (() => void) | null = null;

    browseSounds: (() => Promise<string[]>) | null = null;
    browseFolder: (() => Promise<string | undefined>) | null = null;
    getNameFromPath: ((path: string) => Promise<string>) | null = null;
    getDefaultMovePath: (() => Promise<string>) | null = null;
    parsePath: ((path: string) => Promise<string | null>) | null = null;

    startKeyRecordingSession: (() => Promise<string>) | null = null;
    stopKeyRecordingSession: ((id: string) => void) | null = null;

    getNewsHtml: (() => Promise<string>) | null = null;

    getVersion: (() => Promise<string>) | null = null;
}

export type Actions = NonOptional<ConcreteActions>;
export const actionsKeys = Object.keys(new ConcreteActions) as (keyof Actions)[];

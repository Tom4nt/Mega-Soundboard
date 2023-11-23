import { NonOptional, UpdaterState } from "./interfaces";
import { OptionalSettings, Settings } from "./models";
import { Playable } from "./models/playable";
import { Sound } from "./models/sound";
import { Soundboard } from "./models/soundboard";
import { ActionName } from "./quickActions";

class ConcreteActions {
    minimize: (() => void) | null = null;
    toggleMaximizedState: (() => void) | null = null;
    close: (() => void) | null = null;

    zoomIncrement: ((value: number) => void) | null = null;
    zoomSet: ((val: number) => void) | null = null;
    zoomGet: (() => Promise<number>) | null = null;
    zoomReset: (() => void) | null = null;

    play: ((playableUuid: string) => void) | null = null;

    addSounds: ((sounds: Sound[], destinationId: string | null, moveFile: boolean, startIndex?: number) => Promise<string>) | null = null;
    editPlayable: ((playable: Playable) => void) | null = null;
    movePlayable: ((id: string, destinationId: string | null, destinationIndex: number) => Promise<string>) | null = null;
    copyPlayable: ((id: string, destinationId: string | null, destinationIndex: number) => Promise<string>) | null = null;
    deletePlayable: ((id: string) => void) | null = null;
    getNewSoundsFromPaths: ((paths: string[]) => Promise<Sound[]>) | null = null;
    getValidSoundPaths: ((paths: string[]) => Promise<string[]>) | null = null;
    getPlayableRoot: ((uuid: string) => Promise<Soundboard | undefined>) | null = null;

    getSoundboard: ((uuid: string) => Promise<Soundboard>) | null = null;
    getNewSoundboard: (() => Promise<Soundboard>) | null = null;
    addSoundboard: ((soundboard: Soundboard) => void) | null = null;
    moveSoundboard: ((id: string, destinationIndex: number) => void) | null = null;
    deleteSoundboard: ((id: string) => void) | null = null;
    editSoundboard: ((soundboard: Soundboard) => void) | null = null;
    setCurrentSoundboard: ((id: string) => void) | null = null;
    getSoundboards: (() => Promise<Soundboard[]>) | null = null;
    getInitialSoundboardIndex: (() => Promise<number>) | null = null;
    sortSoundboard: ((id: string) => Promise<void>) | null = null;

    flagChangelogViewed: (() => void) | null = null;
    installUpdate: (() => void) | null = null;
    checkUpdate: (() => Promise<UpdaterState>) | null = null;

    setMainDevice: ((id?: string, volume?: number) => void) | null = null;
    setSecondaryDevice: ((id?: string | null, volume?: number) => void) | null = null;

    getSettings: (() => Promise<Settings>) | null = null;
    saveSettings: ((settings: OptionalSettings) => void) | null = null;
    shouldShowChangelog: (() => Promise<boolean>) | null = null;
    executeQuickAction: ((name: ActionName) => Promise<void>) | null = null;

    openRepo: (() => void) | null = null;
    openFeedback: (() => void) | null = null;

    browseSounds: (() => Promise<string[]>) | null = null;
    browseFolder: (() => Promise<string | undefined>) | null = null;
    getNameFromPath: ((path: string) => Promise<string>) | null = null;
    getDefaultMovePath: (() => Promise<string>) | null = null;
    parsePath: ((path: string) => Promise<string | null>) | null = null;

    startKeyRecordingSession: (() => Promise<string>) | null = null;
    stopKeyRecordingSession: ((id: string) => void) | null = null;
    holdPTT: (() => Promise<string>) | null = null;
    releasePTT: ((handle: string) => Promise<void>) | null = null;

    getNewsHtml: (() => Promise<string>) | null = null;
    getVersion: (() => Promise<string>) | null = null;
}

export type Actions = NonOptional<ConcreteActions>;
export const actionsKeys = Object.keys(new ConcreteActions) as (keyof Actions)[];

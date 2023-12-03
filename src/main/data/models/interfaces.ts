export type JSONObject = { [key: string]: unknown };

export interface ICommon {
    get uuid(): string;
    get name(): string;
    set name(value: string);
    get volume(): number;
    set volume(value: string);
    get keys(): number[];
    compare(other: ICommon): number;
}

export interface IVolumeSource {
    getVolume(): number;
}

export interface IContainer {
    getPlayables(): readonly IPlayable[];
    addPlayable(playable: IPlayable): void;
    removePlayable(playable: IPlayable): void;
    containsPlayable(playable: IPlayable): boolean;
    findPlayableRecursive(predicate: (p: IPlayable) => boolean): IPlayable | undefined;
}

export interface IPlayable extends ICommon {
    getAudioPath(): string;
    get parent(): IContainer | null;
    set parent(value: IContainer | null);
    getSavable(): JSONObject;
    copy(): IPlayable;
}

export interface IPlayableContainer extends IPlayable, IContainer { }

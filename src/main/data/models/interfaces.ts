import { IPlayableData } from "../../../shared/models/data";

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
    addPlayable(playable: IPlayable, index?: number): void;
    removePlayable(playable: IPlayable): void;
    containsPlayable(playable: IPlayable): boolean;
    findPlayablesRecursive(predicate: (p: IPlayable) => boolean): readonly IPlayable[];
    sortPlayables(): void;
}

export interface IPlayable extends ICommon, IVolumeSource {
    getAudioPath(): string;
    get parent(): IContainer | null;
    set parent(value: IContainer | null);
    getSavable(): JSONObject;
    copy(): IPlayable;
    edit(data: IPlayableData): void;
    asData(): IPlayableData;
}

export interface ICommonContainer extends ICommon, IContainer, IVolumeSource { }
export interface IPlayableContainer extends IPlayable, ICommonContainer { }

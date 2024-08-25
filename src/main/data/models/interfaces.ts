import { IBaseData } from "../../../shared/models/dataInterfaces";

export type JSONObject = { [key: string]: unknown };

export interface IBase {
	getUuid(): string;
	getName(): string;
	getKeys(): number[];
	getVolume(): number;
	compare(other: IBase): number;
	edit(data: IBaseData): void;
	asData(): IBaseData;
	getSavable(): JSONObject;
}

export interface IContainer {
	getChildren(): readonly IBaseChild[];
	addChild(child: IBaseChild, index?: number): void;
	removeChild(child: IBaseChild): void;
	contains(child: IBaseChild): boolean;
	findChildrenRecursive(predicate: (p: IBaseChild) => boolean): readonly IBaseChild[];
	sortChildren(): void;
}

export interface IPlayable {
	getDirectPlayables(): IDirectPlayableChild[];
}

export interface IChild {
	parent?: IBaseContainer;
}

export interface IDirectPlayable {
	getAudioPath(): string;
}

export interface IBaseContainer extends IBase, IContainer { }
export interface IBaseChild extends IBase, IChild, IPlayable {
	copy(): IBaseChild;
}

export type IDirectPlayableChild = IDirectPlayable & IBaseChild;

export function isIBase(obj: object): obj is IBase {
	return "getUuid" in obj;
}

export function isIContainer(obj: object): obj is IContainer {
	return "getChildren" in obj;
}

export function isIChild(obj: object): obj is IChild {
	return "parent" in obj;
}

export function isIBaseChild(obj: object): obj is IBaseChild {
	return isIBase(obj) && isIChild(obj) && "getDirectPlayables" in obj && "copy" in obj;
}

export function isIDirectPlayable(obj: object): obj is IDirectPlayable {
	return "getAudioPath" in obj;
}

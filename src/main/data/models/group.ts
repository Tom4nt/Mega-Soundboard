import { convertChildren } from "../../utils/utils";
import { GroupMode, IGroupData } from "../../../shared/models/dataInterfaces";
import { tryGetValue } from "../../../shared/sharedUtils";
import { BaseProperties } from "./baseProperties";
import { IBase, IBaseChild, IBaseContainer, IDirectPlayableChild, JSONObject } from "./interfaces";
import { Container } from "./container";
import { randomUUID } from "crypto";

export class Group implements IBaseChild, IBaseContainer {
	constructor(
		baseProperties: BaseProperties,
		public mode: GroupMode,
		children: IBaseChild[],
	) {
		this.container = new Container(children, this);
		this.uuid = baseProperties.uuid;
		this.name = baseProperties.name;
		this.volume = baseProperties.volume;
		this.keys = baseProperties.keys;
	}

	private current = -1;

	private readonly container: Container;
	readonly parent?: IBaseContainer;
	readonly uuid: string;
	name: string;
	volume: number;
	keys: number[];

	getUuid(): string {
		return this.uuid;
	}

	getKeys(): number[] {
		return this.keys;
	}

	getName(): string {
		return this.name;
	}

	getChildren(): readonly IBaseChild[] {
		return this.container.getChildren();
	}

	addChild(playable: IBaseChild, index?: number | undefined): void {
		playable.parent = this;
		this.container.addChild(playable, index);
	}

	removeChild(playable: IBaseChild): void {
		playable.parent = undefined;
		this.container.removeChild(playable);
	}

	contains(playable: IBaseChild): boolean {
		return this.container.contains(playable);
	}

	findChildrenRecursive(predicate: (p: IBaseChild) => boolean): readonly IBaseChild[] {
		return this.container.findChildrenRecursive(predicate);
	}

	sortChildren(): void {
		this.container.sortChildren();
	}

	getDirectPlayables(): IDirectPlayableChild[] {
		const playables = this.container.getChildren();
		if (playables.length <= 0) throw Error("The group is empty.");
		let index = 0;
		switch (this.mode) {
			case "first":
				index = 0;
				break;
			case "sequence":
				this.current = (this.current + 1) % playables.length;
				index = this.current;
				break;
			case "random":
				index = Math.floor(Math.random() * playables.length);
				break;
			case "combine":
				return playables.flatMap(p => p.getDirectPlayables());
		}
		return playables[index]!.getDirectPlayables();
	}

	getVolume(): number {
		return (this.parent?.getVolume() ?? 0) * this.volume;
	}

	getSavable(): JSONObject {
		return {
			name: this.name,
			volume: this.volume,
			keys: this.keys,
			playables: this.getChildren().map(x => x.getSavable()),
			mode: this.mode,
		};
	}

	copy(): Group {
		return Group.convert(this.getSavable());
	}

	compare(other: IBase): number {
		return this.name.localeCompare(other.getName());
	}

	edit(data: IGroupData): void {
		this.name = data.name;
		this.volume = data.volume;

		this.keys.length = 0;
		this.keys.push(...data.keys);

		this.mode = data.mode;
	}

	asData(): IGroupData {
		return {
			uuid: this.uuid,
			name: this.name,
			mode: this.mode,
			keys: this.keys,
			volume: this.volume,
			isGroup: true,
		};
	}

	static getWithName(name: string): Group {
		return new Group(new BaseProperties(randomUUID(), name, 1, []), "random", []);
	}

	static fromData(data: IGroupData): Group {
		return new Group(BaseProperties.fromData(data), data.mode, []);
	}

	static convert(data: JSONObject): Group {
		const info = BaseProperties.convert(data);

		let playables: IBaseChild[] = [];
		const res = tryGetValue(data, ["playables"], v => Array.isArray(v));
		if (res) playables = convertChildren(res as []);

		let mode: GroupMode = "sequence";
		const res2 = tryGetValue(data, ["mode"], v => typeof v === "string");
		if (res2) mode = res2 as GroupMode;

		return new Group(info, mode, playables);
	}
}

import { convertPlayables } from "../../utils/utils";
import { IGroupData } from "../../../shared/models/dataInterfaces";
import { tryGetValue } from "../../../shared/sharedUtils";
import { BaseProperties } from "./baseProperties";
import { IPlayable, IPlayableContainer, JSONObject } from "./interfaces";
import { Container } from "./container";

type GroupMode = "sequence" | "random" | "first";

export class Group implements IPlayableContainer {
	constructor(
		private readonly baseProperties: BaseProperties,
		public mode: GroupMode,
		public current: number = 0,
		playables: IPlayable[],
	) {
		this.container = new Container(playables);
		this.uuid = baseProperties.uuid;
		this.name = baseProperties.name;
		this.volume = baseProperties.volume;
		this.keys = baseProperties.keys;
	}

	readonly isGroup = true;
	readonly isSound = false;
	readonly isSoundboard = false;
	readonly isContainer = true;

	private readonly container: Container;
	readonly parent: IPlayableContainer | null = null;
	readonly uuid: string;
	name: string;
	volume: number;
	keys: number[];

	getPlayables(): readonly IPlayable[] {
		return this.container.getPlayables();
	}

	addPlayable(playable: IPlayable, index?: number | undefined): void {
		playable.parent = this;
		this.container.addPlayable(playable, index);
	}

	removePlayable(playable: IPlayable): void {
		playable.parent = null;
		this.container.removePlayable(playable);
	}

	containsPlayable(playable: IPlayable): boolean {
		return this.container.containsPlayable(playable);
	}

	findPlayablesRecursive(predicate: (p: IPlayable) => boolean): readonly IPlayable[] {
		return this.container.findPlayablesRecursive(predicate);
	}

	sortPlayables(): void {
		this.container.sortPlayables();
	}

	getAudioPath(): string {
		const playables = this.container.getPlayables();
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
		}
		return playables[index]!.getAudioPath();
	}

	getFinalVolume(): number {
		return ((this.parent?.getFinalVolume() ?? 0) / 100) * (this.volume / 100);
	}

	getSavable(): JSONObject {
		return {
			...this.baseProperties.getSavable(),
			playables: this.getPlayables().map(x => x.getSavable()),
			mode: this.mode,
		};
	}

	copy(): Group {
		return Group.convert(this.getSavable());
	}

	compare(other: IPlayable): number {
		return this.name.localeCompare(other.name);
	}

	edit(data: IGroupData): void {
		this.baseProperties.name = data.name;
		this.baseProperties.volume = data.volume;

		this.baseProperties.keys.length = 0;
		this.baseProperties.keys.push(...data.keys);

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

	static fromData(data: IGroupData): Group {
		return new Group(BaseProperties.fromData(data), data.mode, 0, []);
	}

	static convert(data: JSONObject): Group {
		const info = BaseProperties.convert(data);

		let playables: IPlayable[] = [];
		const res = tryGetValue(data, ["playables"], v => Array.isArray(v));
		if (res) playables = convertPlayables(res as []);

		let mode: GroupMode = "sequence";
		const res2 = tryGetValue(data, ["mode"], v => typeof v === "string");
		if (res2) mode = res2 as GroupMode;

		return new Group(info, mode, 0, playables);
	}
}

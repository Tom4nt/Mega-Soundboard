import { tryGetValue } from "../../../shared/sharedUtils";
import { CommonInfo } from "./commonInfo";
import { Container } from "./container";
import { ICommon, IContainer, IPlayable, IPlayableContainer, IVolumeSource, JSONObject } from "./interfaces";

type GroupMode = "sequence" | "random" | "first";

export class Group implements IPlayableContainer, IVolumeSource {
    readonly parent: (IContainer & IVolumeSource) | null = null;

    constructor(
        private readonly info: CommonInfo,
        private readonly container: IContainer,
        public mode: GroupMode,
        public current: number,
    ) { }

    get uuid(): string { return this.info.uuid; }
    get name(): string { return this.info.name; }
    set name(value: string) { this.info.name = value; }
    get volume(): number { return this.info.volume; }
    set volume(value: number) { this.info.volume = value; }
    get keys(): number[] { return this.info.keys; }

    addPlayable(playable: IPlayable): void {
        this.container.addPlayable(playable);
    }

    removePlayable(playable: IPlayable): void {
        this.container.removePlayable(playable);
    }

    containsPlayable(playable: IPlayable): boolean {
        return this.container.containsPlayable(playable);
    }

    findPlayablesRecursive(predicate: (p: IPlayable) => boolean): IPlayable | undefined {
        return this.container.findPlayablesRecursive(predicate);
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

    getPlayables(): readonly IPlayable[] {
        return this.container.getPlayables();
    }

    getVolume(): number {
        return ((this.parent?.getVolume() ?? 0) / 100) * (this.info.volume / 100);
    }

    getSavable(): JSONObject {
        return {
            ...this.info.getSavable(),
            playables: this.container.getPlayables().map(x => x.getSavable()),
            mode: this.mode,
        };
    }

    copy(): Group {
        return Group.convert(this.getSavable());
    }

    compare(other: ICommon): number {
        return this.info.compare(other);
    }

    static isGroup(data: JSONObject): boolean {
        return "playables" in data && "mode" in data;
    }

    static convert(data: JSONObject): Group {
        const info = CommonInfo.convert(data);

        let playables: IPlayable[] = [];
        const res = tryGetValue(data, ["playables"], v => Array.isArray(v));
        if (res) playables = Container.convertPlayables(res as []);

        let mode: GroupMode = "sequence";
        const res2 = tryGetValue(data, ["mode"], v => typeof v === "string");
        if (res2) mode = res2 as GroupMode;

        const container = new Container(playables);
        return new Group(info, container, mode, 0);
    }
}

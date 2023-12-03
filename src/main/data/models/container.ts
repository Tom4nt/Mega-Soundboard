import { Group } from "./group";
import { IPlayableContainer, IContainer, IPlayable, JSONObject } from "./interfaces";
import { Sound } from "./sound";

export class Container implements IContainer {
    constructor(
        private readonly playables: IPlayable[],
    ) { }

    getPlayables(): readonly IPlayable[] {
        return this.playables;
    }

    addPlayable(playable: IPlayable): void {
        if (playable.parent != null) {
            throw Error("The Playable can't be added to the container because it already has a parent.");
        }
        playable.parent = this;
        this.playables.push(playable);
    }

    removePlayable(playable: IPlayable): void {
        if (playable.parent != this) {
            throw Error("The Playable is not in this container.");
        }
        playable.parent = null;
        const index = this.playables.indexOf(playable);
        this.playables.splice(index, 1);
    }

    containsPlayable(playable: IPlayable): boolean {
        return playable.parent == this && this.playables.indexOf(playable) >= 0;
    }

    findPlayableRecursive(predicate: (p: IPlayable) => boolean): IPlayable | undefined {
        for (const playable of this.playables) {
            if (predicate(playable)) return playable;
            if (this.isPlayableContainer(playable)) {
                return playable.findPlayableRecursive(predicate);
            }
        }
        return undefined;
    }

    isPlayableContainer(playable: IPlayable): playable is IPlayableContainer {
        return this.findPlayableRecursive.name in playable;
    }

    static convertPlayables(data: JSONObject[]): IPlayable[] {
        const playables: IPlayable[] = [];
        data.forEach(item => {
            let s: IPlayable;
            if (Group.isGroup(item)) {
                s = Group.convert(item);
            } else {
                s = Sound.convert(item);
            }
            playables.push(s);
        });
        return playables;
    }
}

import { IContainer, IPlayable, IPlayableContainer } from "./interfaces";

export class Container implements IContainer {
	constructor(
		private readonly playables: IPlayable[],
	) { }

	readonly isSoundboard = false;
	readonly isGroup = false;

	getPlayables(): readonly IPlayable[] {
		return this.playables;
	}

	addPlayable(playable: IPlayable, index?: number): void {
		if (index == undefined) index = this.playables.length - 1;
		this.playables.splice(index, 0, playable);
	}

	removePlayable(playable: IPlayable): void {
		playable.parent = null;
		const index = this.playables.indexOf(playable);
		this.playables.splice(index, 1);
	}

	containsPlayable(playable: IPlayable): boolean {
		return this.playables.indexOf(playable) >= 0;
	}

	findPlayablesRecursive(predicate: (p: IPlayable) => boolean): readonly IPlayable[] {
		const result: IPlayable[] = [];
		for (const playable of this.playables) {
			if (predicate(playable)) result.push(playable);
			if (playable.isContainer) {
				result.push(...(playable as IPlayableContainer).findPlayablesRecursive(predicate));
			}
		}
		return result;
	}

	sortPlayables(): void {
		this.playables.sort((a, b) => a.compare(b));
	}
}

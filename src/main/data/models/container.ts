import { IBaseChild, IContainer, isIContainer } from "./interfaces";

export class Container implements IContainer {
	constructor(
		private readonly children: IBaseChild[],
	) { }

	readonly isSoundboard = false;
	readonly isGroup = false;

	getChildren(): readonly IBaseChild[] {
		return this.children;
	}

	addChild(playable: IBaseChild, index?: number): void {
		if (index == undefined) index = this.children.length - 1;
		this.children.splice(index, 0, playable);
	}

	removeChild(playable: IBaseChild): void {
		const index = this.children.indexOf(playable);
		this.children.splice(index, 1);
	}

	contains(playable: IBaseChild): boolean {
		return this.children.indexOf(playable) >= 0;
	}

	findChildrenRecursive(predicate: (p: IBaseChild) => boolean): readonly IBaseChild[] {
		const result: IBaseChild[] = [];
		for (const playable of this.children) {
			if (predicate(playable)) result.push(playable);
			if (isIContainer(playable)) {
				result.push(...playable.findChildrenRecursive(predicate));
			}
		}
		return result;
	}

	sortChildren(): void {
		this.children.sort((a, b) => a.compare(b));
	}
}

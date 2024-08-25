import { IBaseChild, IBaseContainer, IContainer, isIContainer } from "./interfaces";

export class Container implements IContainer {
	constructor(
		private readonly children: IBaseChild[],
		private readonly owner: IBaseContainer,
	) {
		children.forEach(c => c.parent = owner);
	}

	getChildren(): readonly IBaseChild[] {
		return this.children;
	}

	addChild(child: IBaseChild, index?: number): void {
		if (index == undefined) index = this.children.length - 1;
		this.children.splice(index, 0, child);
		child.parent = this.owner;
	}

	removeChild(child: IBaseChild): void {
		const index = this.children.indexOf(child);
		this.children.splice(index, 1);
		child.parent = undefined;
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

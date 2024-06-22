import { IPlayable, IPlayableContainer } from "./interfaces";

interface NodeSource {
	uuid: string;
	getPlayables(): readonly IPlayable[];
}

export default class UuidTree {
	readonly nodes: UuidNode[] = [];
	readonly root: UuidNode;

	constructor(
		readonly rootContainer: NodeSource
	) {
		this.root = UuidNode.fromContainer(rootContainer, (n) => this.nodes.push(n));
	}
}

export class UuidNode {
	constructor(
		readonly uuid: string,
		readonly children: UuidNode[],
		readonly parent?: UuidNode,
	) { }

	static fromContainer(
		container: NodeSource,
		onGetNode: (node: UuidNode) => void,
		parent?: UuidNode,
	): UuidNode {
		const playables = container.getPlayables();
		const children: UuidNode[] = [];
		const instance = new UuidNode(container.uuid, children, parent);
		for (const playable of playables) {
			if (playable.isContainer) {
				const newNode = this.fromContainer(playable as IPlayableContainer, onGetNode, instance);
				onGetNode(newNode);
				children.push(newNode);
			} else {
				const newNode = new UuidNode(playable.uuid, [], instance);
				onGetNode(newNode);
				children.push(newNode);
			}
		}
		return instance;
	}

	getHierarchy(): UuidNode[] {
		if (this.parent) {
			return [this, ...this.parent.getHierarchy()];
		} else {
			return [this];
		}
	}

	/** Recursively returns all children in a flat array. Includes itself. */
	getFlatChildren(): UuidNode[] {
		return [this, ...this.children.flatMap(c => c.getFlatChildren())];
	}
}

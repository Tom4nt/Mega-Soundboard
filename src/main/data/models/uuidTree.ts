import { IBase, isIContainer } from "./interfaces";

interface NodeSource {
	getUuid(): string;
	getChildren(): readonly IBase[];
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
		const baseChildren = container.getChildren();
		const nodeChildren: UuidNode[] = [];
		const instance = new UuidNode(container.getUuid(), nodeChildren, parent);
		for (const child of baseChildren) {
			if (isIContainer(child)) {
				const newNode = this.fromContainer(child, onGetNode, instance);
				onGetNode(newNode);
				nodeChildren.push(newNode);
			} else {
				const newNode = new UuidNode(child.getUuid(), [], instance);
				onGetNode(newNode);
				nodeChildren.push(newNode);
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

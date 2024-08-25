import { UuidHierarchyData } from "../../../shared/models/dataInterfaces";

export default class UuidHierarchy extends Array<string> {
	constructor(...items: string[]) {
		super(...items);
	}

	/** Gets the longest possible path that does not interfere with any other specified hierarchy. */
	getLongestExclusivePath(...others: UuidHierarchy[]): UuidHierarchy {
		for (let i = 0; i < this.length; i++) {
			const noneEquals = others.find(x => x[i] === this[i]) === undefined;
			if (noneEquals) return new UuidHierarchy(...this.slice(i));
		}
		return new UuidHierarchy(this.at(-1)!);
	}

	asData(): UuidHierarchyData {
		return [...this];
	}
}

import { Point } from "../../shared/interfaces";
import { PlayableContainer } from "../elements";

type RowCol = { row: number, col: number };

export default class ContainerHelper {
	constructor(
		private readonly container: PlayableContainer,
		private readonly containerDiv: HTMLElement,
		private readonly padding: number,
		private readonly getSubContainer: () => PlayableContainer | null
	) { }

	/** Returns the index of the item where the drag dummy should be inserted with insertBefore.
	 * If the position is inside a sub-container, returns null. */
	public getIndexAtPosition(pos: Point): number | null {
		const [posL, width] = this.toLocal(pos);
		const rowHeight = parseInt(getComputedStyle(this.containerDiv).getPropertyValue("grid-template-rows"));
		if (!rowHeight) return 0;

		let rowIndex = Math.floor(posL.y / rowHeight);
		const subContainerRow = this.getCurrentSubContainerRow();

		if (subContainerRow && rowIndex >= subContainerRow) {
			const rowY = subContainerRow * rowHeight;
			const subContainerHeight = this.getCurrentSubContainerHeight()!; // Not null because subContainerRow is also not null
			const bottom = rowY + subContainerHeight;
			if (posL.y < bottom) {
				return null;
			}
			rowIndex = Math.floor((posL.y - subContainerHeight) / rowHeight);
		}

		const itemsPerRow = this.getItemsPerRow();
		const itemWidth = width / itemsPerRow;

		const rowCount = this.container.filteredItems.length / itemsPerRow;
		rowIndex = Math.max(0, Math.min(rowCount, rowIndex));

		let colIndex = Math.floor(posL.x / itemWidth);
		colIndex = Math.max(0, Math.min(itemsPerRow, colIndex));

		return this.rowColToIndex({ row: rowIndex, col: colIndex }, itemsPerRow);
	}

	private toLocal(pos: Point): [Point, number] {
		const rect = this.container.getBoundingClientRect();
		const rect2 = new DOMRect(
			rect.x + this.padding, rect.y + this.padding,
			rect.width - this.padding * 2, rect.height - this.padding * 2,
		);
		return [{ x: pos.x - rect2.left, y: pos.y - rect2.top }, rect2.width];
	}

	private getCurrentSubContainerHeight(): number | null {
		const subContainer = this.getSubContainer();
		if (!subContainer) return null;
		const style = window.getComputedStyle(subContainer);
		const topMargin = parseInt(style.marginTop);
		const bottomMargin = parseInt(style.marginBottom);
		return subContainer.getHeight() + topMargin + bottomMargin;
	}

	private getCurrentSubContainerRow(): number | null {
		const subContainer = this.getSubContainer();
		if (!subContainer) return null;
		const uuid = subContainer.parentUuid;
		const item = this.container.filteredItems.find(x => x.playable.uuid === uuid);
		if (!item) return null;
		const itemRowCol = this.getItemRowCol(item.playable.uuid);
		return itemRowCol ? itemRowCol.row + 1 : null;
	}

	private getItemRowCol(uuid: string): RowCol | null {
		const itemIndex = this.container.filteredItems.findIndex(x => x.playable.uuid === uuid);
		if (itemIndex < 0) return null;
		return this.indexToRowCol(itemIndex, this.getItemsPerRow());
	}

	private indexToRowCol(index: number, itemsPerRow: number): RowCol {
		const row = Math.floor(index / itemsPerRow);
		const col = index % itemsPerRow;
		return { row, col };
	}

	private rowColToIndex(rowCol: RowCol, itemsPerRow: number): number {
		return rowCol.row * itemsPerRow + rowCol.col;
	}

	private getItemsPerRow(): number {
		const minWidth = this.getMinWidth();
		const totalWidth = this.container.offsetWidth;
		return Math.floor(totalWidth / minWidth);
	}

	private getMinWidth(): number {
		return parseInt(getComputedStyle(document.body).getPropertyValue("--min-playable-width"));
	}
}

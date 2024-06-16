import { Point } from "../../shared/interfaces";
import { Event, ExposedEvent } from "../../shared/events";
import MSR from "../msr";

const START_DIST = 5;

export type DragStartArgs = {
	draggable: Draggable,
	ghost: HTMLElement,
	startPos: Point,
	offset: Point,
}

export default abstract class Draggable extends HTMLElement {
	private isMouseDown = false;
	private startPos: Point = { x: 0, y: 0 };

	lockVertical = false;
	lockHorizontal = false;
	allowDrag = true;

	private _isBeingDragged = false;

	private _onDragStart = new Event<DragStartArgs>();
	get onDragStart(): ExposedEvent<DragStartArgs> { return this._onDragStart.expose(); }

	constructor() {
		super();

		this.addEventListener("mousedown", e => {
			if (e.button !== 0 || !this.allowDrag) return;
			this.isMouseDown = true;
			this.startPos = { x: e.clientX, y: e.clientY };
		});

		document.addEventListener("mousemove", e => {
			const p = { x: e.clientX, y: e.clientY };

			if (!this._isBeingDragged && this.isMouseDown) {
				const validDistance = Draggable.getDistance(this.startPos, p) >= START_DIST;
				if (validDistance) {
					//this.offset = this.getOffset();
					this.startDrag(p, this.getOffset());
				}
			}
		});

		document.addEventListener("mouseup", () => {
			this.isMouseDown = false;
			this._isBeingDragged = false;
		});
	}

	/** Creates the element that follows the cursor while dragging. */
	protected abstract createGhost(position: Point, offset: Point): HTMLElement;

	protected connectedCallback(): void {
		MSR.instance.draggableManager.register(this);
	}

	protected disconnectedCallback(): void {
		MSR.instance.draggableManager.unregister(this);
	}

	protected startDrag(pos: Point, offset: Point): void {
		this._isBeingDragged = true;

		const ghost = this.createGhost(pos, offset);
		document.body.append(ghost);

		this.addStyles(ghost);
		this._onDragStart.raise({ ghost, startPos: pos, draggable: this, offset });
	}

	private getOffset(): Point {
		const rect = this.getBoundingClientRect();
		const top = parseFloat(window.getComputedStyle(this).marginTop);
		const left = parseFloat(window.getComputedStyle(this).marginLeft);
		return {
			x: this.startPos.x - rect.left + left,
			y: this.startPos.y - rect.top + top
		};
	}

	private addStyles(element: HTMLElement): void {
		element.style.position = "fixed";
		element.style.pointerEvents = "none";
		element.style.zIndex = "1";
	}

	private static getDistance(p1: Point, p2: Point): number {
		return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
	}
}

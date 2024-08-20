import { Draggable } from "./elements";
import { Event, ExposedEvent } from "../shared/events";
import { Point } from "../shared/interfaces";
import { DragPreStartArgs as DraggablePreStartArgs, DragStartArgs } from "./elements/draggable";

export type DragEventArgs = {
	ghost: HTMLElement,
	pos: Point,
}

export type DragPreStartArgs = {
	element: Draggable,
	pos: Point,
	cancel: boolean,
}

export default class DraggableManager {
	private _lockX = false;
	private _lockY = false;
	private _offset: Point = { x: 0, y: 0 };
	private _lastPos: Point = { x: 0, y: 0 };

	constructor() {
		document.addEventListener("mouseup", this.handleMouseUp);
		document.addEventListener("mousemove", this.handleMouseMove);
	}

	private _currentGhost: HTMLElement | null = null;
	get currentGhost(): HTMLElement | null { return this._currentGhost; }

	private _onDragPreStart = new Event<DragPreStartArgs>();
	get onDragPreStart(): ExposedEvent<DragPreStartArgs> { return this._onDragPreStart.expose(); }

	private _onDragStart = new Event<DragEventArgs>();
	get onDragStart(): ExposedEvent<DragEventArgs> { return this._onDragStart.expose(); }

	private _onDragEnd = new Event<DragEventArgs>();
	get onDragEnd(): ExposedEvent<DragEventArgs> { return this._onDragEnd.expose(); }

	private _onDragUpdate = new Event<DragEventArgs>();
	get onDragUpdate(): ExposedEvent<DragEventArgs> { return this._onDragUpdate.expose(); }

	register(draggable: Draggable): void {
		draggable.onDragPreStart.addHandler(this.handleDragPreStart);
		draggable.onDragStart.addHandler(this.handleDragStart);
	}

	unregister(draggable: Draggable): void {
		draggable.onDragStart.removeHandler(this.handleDragStart);
	}

	update(): void {
		if (!this._currentGhost) throw Error("Cannot update drag. No dragging is being performed.");
		this._onDragUpdate.raise({ ghost: this._currentGhost, pos: this._lastPos });
	}

	endDrag(): void {
		if (!this._currentGhost) throw Error("Cannot end drag. No dragging is being performed.");
		const ghostBefore = this._currentGhost;
		this._currentGhost.remove();
		this._currentGhost = null;
		this._onDragEnd.raise({ ghost: ghostBefore, pos: this._lastPos });
	}

	private positionGhost(pos: Point): void {
		if (!this._currentGhost) throw Error("Cannot set the position of the ghost. No dragging is being performed.");
		if (!this._lockX) this._currentGhost.style.left = `${pos.x - this._offset.x}px`;
		if (!this._lockY) this._currentGhost.style.top = `${pos.y - this._offset.y}px`;
	}

	private handleDragPreStart = (d: DraggablePreStartArgs): void => {
		const args = { element: d.draggable, pos: d.startPos, cancel: d.cancel };
		this._onDragPreStart.raise(args);
		d.cancel = args.cancel;
	};

	private handleDragStart = (d: DragStartArgs): void => {
		this._currentGhost = d.ghost;
		this._offset = d.offset;
		this._lockX = d.draggable.lockHorizontal;
		this._lockY = d.draggable.lockVertical;
		this._lastPos = d.startPos;
		this._onDragStart.raise({ ghost: d.ghost, pos: d.startPos });
		this.positionGhost(d.startPos);
		this.update();
	};

	private handleMouseUp = (): void => {
		if (!this._currentGhost) return;
		this.endDrag();
	};

	private handleMouseMove = (e: MouseEvent): void => {
		if (!this._currentGhost) return;
		const pos = { x: e.clientX, y: e.clientY };
		this._lastPos = pos;
		this.positionGhost(pos);
		this.update();
	};
}

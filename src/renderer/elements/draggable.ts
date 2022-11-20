import { Event, ExposedEvent } from "../../shared/events";
import { Point } from "../../shared/interfaces";

const START_DIST = 5;

export default abstract class Draggable extends HTMLElement {
    static get currentElement(): Draggable | null { return Draggable._currentElement; }
    private static _currentElement: Draggable | null = null;

    lockVertical = false;
    lockHorizontal = false;

    private _onDragEnd = new Event<void>;
    get onDragEnd(): ExposedEvent<void> { return this._onDragEnd.expose(); }

    /** CSS class to add to the Element while it's being dragged. */
    protected abstract get classDuringDrag(): string;

    private isMouseDownOnThis = false;
    private isDragging = false;
    private initialPos: Point = { x: 0, y: 0 };
    private offset: Point | null = null;

    constructor() {
        super();

        this.addEventListener("mousedown", e => {
            this.isMouseDownOnThis = true;
            this.initialPos = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener("mousemove", e => {
            const p = { x: e.clientX, y: e.clientY };
            const validDistance = Draggable.getDistance(this.initialPos, p) >= START_DIST;
            if (!Draggable.currentElement && this.isMouseDownOnThis && validDistance) {
                Draggable._currentElement = this;
                this.updateOffset();
                return;
            }
            if (this.isMouseDownOnThis && Draggable._currentElement) {
                if (!this.isDragging) this.sartDrag();
                if (this.offset) this.move(p, this.offset);
            }
        });

        document.addEventListener("mouseup", () => {
            this.isMouseDownOnThis = false;
            this.isDragging = false;
            Draggable._currentElement = null;
            this._onDragEnd.raise();
            this.endDrag();
        });
    }

    private move(pos: Point, offset: Point): void {
        if (!this.lockHorizontal) this.style.left = `${pos.x - offset.x}px`;
        if (!this.lockVertical) this.style.top = `${pos.y - offset.y}px`;
    }

    private updateOffset(): void {
        const rect = this.getBoundingClientRect();
        this.offset = {
            x: this.initialPos.x - rect.left,
            y: this.initialPos.y - rect.top
        };
    }

    private sartDrag(): void {
        this.isDragging = true;

        this.style.width = `${this.offsetWidth}px`;
        this.style.position = "fixed";
        this.style.pointerEvents = "none";
        this.style.zIndex = "1";

        this.classList.add(this.classDuringDrag);
    }

    private endDrag(): void {
        this.isDragging = false;

        this.style.position = "";
        this.style.pointerEvents = "";
        this.style.zIndex = "";
        this.style.width = "";
        this.style.top = "";
        this.style.left = "";

        this.classList.remove(this.classDuringDrag);
    }

    private static getDistance(p1: Point, p2: Point): number {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
}

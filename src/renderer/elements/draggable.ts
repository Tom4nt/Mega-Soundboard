import { Event, ExposedEvent } from "../../shared/events";
import { Point } from "../../shared/interfaces";

const START_DIST = 5;

type HintIcon = "move" | "add" | null;
type Mode = "move" | "duplicate";

export default abstract class Draggable extends HTMLElement {
    static get currentElement(): Draggable | null { return Draggable._currentElement; }
    private static _currentElement: Draggable | null = null;

    lockVertical = false;
    lockHorizontal = false;
    allowDrag = true;

    private hintText = "";
    private hintIcon: HintIcon = null;
    private dragClone: Draggable | null = null;
    private _dragMode: Mode = "move";
    private _onDragEnd = new Event<void>;
    private _onDragStart = new Event<void>;

    get onDragStart(): ExposedEvent<void> { return this._onDragStart.expose(); }
    get onDragEnd(): ExposedEvent<void> { return this._onDragEnd.expose(); }
    get isBeingDragged(): boolean { return this.isDragging; }

    /** The visual mode of the draggable. Can be set while dragging.
     * @move The element is invisible in the original parent. It visually moves out of it.
     * @duplicate The element stays unchanged. A new element is created and behaves as "move".
     */
    set dragMode(val: Mode) {
        if (val === this._dragMode) return;
        this._dragMode = val;
        this.switchMode();
    }

    /** CSS class to add to the Element while it's being dragged. */
    protected abstract get classDuringDrag(): string;

    private isMouseDownOnThis = false;
    private isDragging = false;
    private initialPos: Point = { x: 0, y: 0 };
    private offset: Point | null = null;
    private currentDragHint: HTMLDivElement | null = null;

    constructor() {
        super();

        this.addEventListener("mousedown", e => {
            if (e.button !== 0 || !this.allowDrag) return;
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
                if (!this.isDragging) {
                    this.sartDrag();
                    this._onDragStart.raise();
                }
                if (this.offset) this.move(p, this.offset, this.offsetHeight);
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

    setDragHint(text?: string, icon?: HintIcon): void {
        if (text !== undefined) this.hintText = text;
        if (icon !== undefined) this.hintIcon = icon;
        if (this.currentDragHint) this.populateDragHint(this.currentDragHint);
    }

    private getDragHint(): HTMLDivElement {
        const elem = document.createElement("div");
        elem.className = "drag-hint";
        this.populateDragHint(elem);
        return elem;
    }

    private populateDragHint(root: HTMLDivElement): void {
        root.innerHTML = ""; // Clear all children

        if (this.hintIcon) {
            const iconSpan = document.createElement("span");
            iconSpan.className = "icon";
            iconSpan.innerText = this.hintIcon;
            root.append(iconSpan);
        }

        if (this.hintText) {
            const textSpan = document.createElement("span");
            textSpan.innerText = this.hintText;
            root.append(textSpan);
        }

        root.style.display = this.hintText ? "" : "none";
    }

    protected move(pos: Point, offset: Point, hintVerticalOffset: number): void {
        const targetMovable = this._dragMode === "move" ? this : this.dragClone;

        if (targetMovable) {
            if (!this.lockHorizontal) targetMovable.style.left = `${pos.x - offset.x}px`;
            if (!this.lockVertical) targetMovable.style.top = `${pos.y - offset.y}px`;
        }

        if (this.currentDragHint) {
            this.currentDragHint.style.left = `${pos.x}px`;
            this.currentDragHint.style.top = `${pos.y - offset.y + hintVerticalOffset}px`;
        }
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

        if (this._dragMode === "duplicate") {
            const clone = this.cloneNode(true) as Draggable; // TODO: Does not work because it does not pass the sound to the constructor.
            this.dragClone = clone;
        }

        this.addStyles(this._dragMode === "move" ? this : this.dragClone!);

        this.currentDragHint = this.getDragHint();
        document.body.append(this.currentDragHint);
    }

    private endDrag(): void {
        this.isDragging = false;

        if (this._dragMode === "move") {
            this.resetStyles(this);
            this.classList.remove(this.classDuringDrag);
        } else {
            this.dragClone?.remove();
            this.dragClone = null;
        }

        this.currentDragHint?.remove();
    }

    private addStyles(element: HTMLElement): void {
        element.classList.add(this.classDuringDrag);
        element.style.width = `${element.offsetWidth}px`;
        element.style.position = "fixed";
        element.style.pointerEvents = "none";
        element.style.zIndex = "1";
    }

    private resetStyles(element: HTMLElement): void {
        element.classList.remove(this.classDuringDrag);
        element.style.position = "";
        element.style.pointerEvents = "";
        element.style.zIndex = "";
        element.style.width = "";
        element.style.top = "";
        element.style.left = "";
    }

    private switchMode(): void {
        if (this._dragMode === "move") {
            this.dragClone?.remove();
            this.addStyles(this);
        } else {
            this.resetStyles(this);
            this.dragClone = this.cloneNode(true) as Draggable;
            this.addStyles(this.dragClone);
        }
    }

    private static getDistance(p1: Point, p2: Point): number {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
}

import { Event, ExposedEvent } from "../../shared/events";
import { Point } from "../../shared/interfaces";

const START_DIST = 5;

type TagIcon = "move" | "add" | null;

export default abstract class Draggable extends HTMLElement {
    static get currentElement(): Draggable | null { return Draggable._currentElement; }
    private static _currentElement: Draggable | null = null;

    lockVertical = false;
    lockHorizontal = false;
    allowDrag = true;

    private tagText = "";
    private tagIcon: TagIcon = null;

    private _onDragEnd = new Event<void>;
    get onDragEnd(): ExposedEvent<void> { return this._onDragEnd.expose(); }

    /** CSS class to add to the Element while it's being dragged. */
    protected abstract get classDuringDrag(): string;

    private isMouseDownOnThis = false;
    private isDragging = false;
    private initialPos: Point = { x: 0, y: 0 };
    private offset: Point | null = null;
    private currentDragTag: HTMLDivElement | null = null;

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
                if (!this.isDragging) this.sartDrag();
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

    setDragTag(text: string, icon: TagIcon): void {
        this.tagText = text;
        this.tagIcon = icon;
        if (this.currentDragTag) this.populateDragTag(this.currentDragTag);
    }

    private getDragTag(): HTMLDivElement {
        const elem = document.createElement("div");
        elem.className = "drag-tag";
        this.populateDragTag(elem);
        return elem;
    }

    private populateDragTag(root: HTMLDivElement): void {
        root.innerHTML = ""; // Clear all children
        let hasAny = false;

        if (this.tagIcon) {
            const iconSpan = document.createElement("span");
            iconSpan.className = "icon";
            iconSpan.innerText = this.tagIcon;
            root.append(iconSpan);
            hasAny = true;
        }

        if (this.tagText) {
            const textSpan = document.createElement("span");
            textSpan.innerText = this.tagText;
            root.append(textSpan);
            hasAny = true;
        }

        root.style.display = hasAny ? "" : "none";
    }

    protected move(pos: Point, offset: Point, tagVerticalOffset: number): void {
        if (!this.lockHorizontal) this.style.left = `${pos.x - offset.x}px`;
        if (!this.lockVertical) this.style.top = `${pos.y - offset.y}px`;

        if (this.currentDragTag) {
            this.currentDragTag.style.left = `${pos.x}px`;
            this.currentDragTag.style.top = `${pos.y - offset.y + tagVerticalOffset}px`;
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

        this.style.width = `${this.offsetWidth}px`;
        this.style.position = "fixed";
        this.style.pointerEvents = "none";
        this.style.zIndex = "1";

        this.currentDragTag = this.getDragTag();
        this.parentElement?.append(this.currentDragTag);

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

        this.currentDragTag?.remove();
        this.classList.remove(this.classDuringDrag);
    }

    private static getDistance(p1: Point, p2: Point): number {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
}

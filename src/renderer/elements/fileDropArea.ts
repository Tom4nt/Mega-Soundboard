import { Event, ExposedEvent } from "../../shared/events";
import MSR from "../msr";

export interface FileDropAreaEvent {
	innerEvent: DragEvent,
	isOver: boolean,
}

export default class FileDropArea extends HTMLElement {
	private _onEnter = new Event<DragEvent>();
	private _onOver = new Event<DragEvent>();
	private _onLeave = new Event<DragEvent>();
	private _onDrop = new Event<DragEvent>();
	private _dragDepth = 0;

	public get onEnter(): ExposedEvent<DragEvent> { return this._onEnter.expose(); }
	public get onOver(): ExposedEvent<DragEvent> { return this._onOver.expose(); }
	public get onLeave(): ExposedEvent<DragEvent> { return this._onLeave.expose(); }
	public get onDrop(): ExposedEvent<DragEvent> { return this._onDrop.expose(); }

	constructor(private checkAllows?: () => boolean) {
		super();
	}

	protected connectedCallback(): void {
		this.addEventListener("dragenter", this.handleDragEnter);
		this.addEventListener("dragover", this.handleDragOver);
		this.addEventListener("dragleave", this.handleDragLeave);
		this.addEventListener("drop", this.handleDrop);
	}

	private handleDragEnter = (e: DragEvent): void => {
		e.preventDefault();
		if (MSR.instance.modalManager.hasOpenModal || !this.check()) return;
		if (this._dragDepth === 0) this._onEnter.raise(e);
		this._dragDepth++;
	};

	private handleDragOver = (e: DragEvent): void => {
		e.preventDefault();
		if (MSR.instance.modalManager.hasOpenModal || !this.check()) return;
		this._onOver.raise(e);
	};

	private handleDragLeave = (e: DragEvent): void => {
		e.preventDefault();
		if (MSR.instance.modalManager.hasOpenModal || !this.check()) return;
		this._dragDepth--;
		if (this._dragDepth === 0) this._onLeave.raise(e);
	};

	private handleDrop = (e: DragEvent): void => {
		e.preventDefault();
		this._dragDepth = 0;
		this._onDrop.raise(e);
	};

	private check(): boolean {
		if (this.checkAllows) return this.checkAllows();
		else return true;
	}
}

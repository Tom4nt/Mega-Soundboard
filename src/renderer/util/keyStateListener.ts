import { Event, ExposedEvent } from "../../shared/events";

export default class KeyStateListener {
    private _isCtrlPressed = false;
    private _isShiftPressed = false;
    private _onStateChanged = new Event<KeyStateListener>();

    get isCtrlPressed(): boolean { return this._isCtrlPressed; }
    get isShiftPressed(): boolean { return this._isShiftPressed; }

    get onStateChanged(): ExposedEvent<KeyStateListener> { return this._onStateChanged; }

    constructor() {
        document.addEventListener("keydown", this.update);
        document.addEventListener("keyup", this.update);
    }

    public finish(): void {
        document.removeEventListener("keydown", this.update);
        document.removeEventListener("keyup", this.update);
    }

    private update = (e: KeyboardEvent): void => {
        this._isCtrlPressed = e.ctrlKey;
        this._isShiftPressed = e.shiftKey;
        this._onStateChanged.raise(this);
    };
}

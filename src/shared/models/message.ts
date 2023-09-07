import { Event, ExposedEvent } from "../events";

export default class Message {
    private _onClose = new Event<void>();
    private _isClosed = false;

    public get onClose(): ExposedEvent<void> { return this._onClose.expose(); }
    public get isClosed(): boolean { return this._isClosed; }

    public constructor(
        public content: string,
        public delay = 0,
    ) { }

    public fireClose(): void {
        if (this._isClosed) return;
        this._isClosed = true;
        this._onClose.raise();
    }
}

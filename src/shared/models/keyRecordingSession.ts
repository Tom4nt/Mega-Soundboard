export default class KeyRecordingSession {
    public get combination(): number[] { return this._combination; }

    private _combination: number[] = [];

    constructor(readonly uuid: string) { }

    public update(combination: number[]): void {
        this._combination = [...combination];
    }
}

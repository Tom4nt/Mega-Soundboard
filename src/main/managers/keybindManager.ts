import { Event, ExposedEvent } from "../../shared/events";
import { uIOhook } from "uiohook-napi";
import { randomUUID } from "crypto";
import KeyRecordingSession from "../../shared/models/keyRecordingSession";
import EventSender from "../eventSender";

export default class KeybindManager {
    raiseExternal = true;

    get onKeybindPressed(): ExposedEvent<number[]> { return this._onKeybindPressed.expose(); }
    private _onKeybindPressed = new Event<number[]>();

    private currentCombination: number[] = [];
    private sessions = new Map<string, KeyRecordingSession>();

    constructor() {
        uIOhook.on("keydown", e => {
            if (!this.currentCombination.includes(e.keycode))
                this.currentCombination.push(e.keycode);
            this.updateRecordingSessions(true);
            this.sendKeybindPressed();
        });
        uIOhook.on("keyup", e => {
            const index = this.currentCombination.indexOf(e.keycode);
            if (index >= 0) this.currentCombination.splice(index, 1);
        });
        uIOhook.start();
    }

    static stopUIOhook(): void {
        uIOhook.stop();
    }

    /** Starts a recording session and returns its generated UUID. */
    startRecordingSession(): string {
        const uuid = randomUUID();
        const session = new KeyRecordingSession(uuid);
        this.sessions.set(uuid, session);
        return uuid;
    }

    stopRecordingSession(uuid: string): void {
        const has = this.sessions.has(uuid);
        if (!has) throw Error(`Session with UUID ${uuid} was not found.`);
        this.sessions.delete(uuid);
    }

    private updateRecordingSessions(pressed: boolean): void {
        for (const session of this.sessions.values()) {
            session.update(this.currentCombination, pressed);
            EventSender.send("onKeyRecordingProgress", {
                combination: session.combination,
                uuid: session.uuid
            });
        }
    }

    private sendKeybindPressed(): void {
        this._onKeybindPressed.raise(this.currentCombination);
        if (this.raiseExternal) EventSender.send("onKeybindPressed", this.currentCombination);
    }
}

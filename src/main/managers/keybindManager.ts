import { Event, ExposedEvent } from "../../shared/events";
import { uIOhook } from "uiohook-napi";
import { randomUUID } from "crypto";
import KeyRecordingSession from "../../shared/models/keyRecordingSession";
import EventSender from "../eventSender";

export default class KeybindManager {
	raiseExternal = true;
	processKeysOnRelease = true;

	get onKeybindPressed(): ExposedEvent<number[]> { return this._onKeybindPressed.expose(); }
	private _onKeybindPressed = new Event<number[]>();

	private currentCombination: number[] = [];
	private sessions = new Map<string, KeyRecordingSession>();
	private downKeys = new Map<string, number[]>();
	/** Indicates whether a keybind was processed when a key was relased to avoid processing on the next key release. */
	private processedKeybindOnRelease = true;

	constructor() {
		uIOhook.on("keydown", e => {
			if (!this.currentCombination.includes(e.keycode)) {
				this.currentCombination.push(e.keycode);
			} else {
				return;
			}
			if (!this.processKeysOnRelease) {
				this.updateRecordingSessions();
				this.sendKeybindPressed();
			}
			this.processedKeybindOnRelease = false;
		});
		uIOhook.on("keyup", e => {
			if (this.processKeysOnRelease && !this.processedKeybindOnRelease) {
				this.updateRecordingSessions();
				this.sendKeybindPressed();
				this.processedKeybindOnRelease = true;
			}
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

	holdKeys(keys: number[]): string {
		for (const key of keys) {
			uIOhook.keyToggle(key, "down");
		}
		const uuid = randomUUID();
		this.downKeys.set(uuid, keys);
		return uuid;
	}

	releaseKeys(handle: string): void {
		const keys = this.downKeys.get(handle);
		if (!keys) return;
		for (const key of keys) {
			uIOhook.keyToggle(key, "up");
		}
	}

	private updateRecordingSessions(): void {
		for (const session of this.sessions.values()) {
			session.update(this.currentCombination);
			EventSender.send("keyRecordingProgress", {
				combination: session.combination,
				uuid: session.uuid
			});
		}
	}

	private sendKeybindPressed(): void {
		this._onKeybindPressed.raise(this.currentCombination);
		if (this.raiseExternal) EventSender.send("keybindPressed", this.currentCombination);
	}
}

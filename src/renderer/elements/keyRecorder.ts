import Keys from "../../shared/keys";
import { Event, ExposedEvent } from "../../shared/events";

const NO_KEY_DESC = "No Keybind";

export default class KeyRecorder extends HTMLElement {
    private labelElement!: HTMLSpanElement;
    private indicatorElement!: HTMLSpanElement;

    private currentRecordingSessionId: string | null = null;
    // private recordingBuffer: number[] = [];

    private _onClear = new Event<void>;
    get onClear(): ExposedEvent<void> { return this._onClear.expose(); }

    private _keys: number[] = [];
    get keys(): number[] {
        return this._keys;
    }
    set keys(keys: number[]) {
        this._keys = keys;
        if (this.isConnected) this.setDisplayedKeys(Keys.toKeyStringArray(keys));
    }

    get isRecording(): boolean { return this.currentRecordingSessionId != null; }

    // handleKeyDown = (key: number): void => {
    //     if (!this.isRecording) return;
    //     if (!this.recordingBuffer.includes(key)) {
    //         this.recordingBuffer.push(key);
    //     }
    //     this.keys = [];
    // };

    // handleKeyUp = (key: number): void => {
    //     if (!this.isRecording) return;
    //     this.recordingBuffer.splice(this.recordingBuffer.indexOf(key), 1);
    // };

    protected connectedCallback(): void {
        const label = document.createElement("span");
        label.classList.add("keyrecorder-label");
        label.innerHTML = NO_KEY_DESC;
        this.labelElement = label;

        const indicator = document.createElement("span");
        indicator.classList.add("keyrecorder-indicator");
        indicator.innerHTML = "Record keybind";
        this.indicatorElement = indicator;

        this.append(label, indicator);

        this.setDisplayedKeys(Keys.toKeyStringArray(this.keys));

        this.addEventListener("click", () => {
            if (this.isRecording) this.stop();
            else this.start();
        });

        this.oncontextmenu = (): void => { this.clear(); };

        window.events.onKeyRecordingProgress.addHandler(keys => {
            this.setDisplayedKeys(Keys.toKeyStringArray(keys));
        });
    }

    protected disconnectedCallback(): void {
        this.stop();
        this.oncontextmenu = null;
    }

    start(): void {
        void this.startInternal();
    }

    stop(): void {
        if (!this.currentRecordingSessionId) return;
        this.classList.remove("recording");
        this.labelElement.innerHTML = NO_KEY_DESC;
        this.indicatorElement.innerHTML = "Record keybind";
        window.actions.stopKeyRecordingSession(this.currentRecordingSessionId);
        this.currentRecordingSessionId = null;
    }

    setDisplayedKeys(keys: string[]): void {
        if (keys.length <= 0) return;

        const keyElements = this.querySelectorAll(".key");
        keyElements.forEach(e => e.remove());
        this.labelElement.style.display = "none";

        keys.forEach(key => {
            const keyE = document.createElement("span");
            keyE.innerHTML = key;
            keyE.classList.add("key");
            this.append(keyE);
        });
    }

    clear(): void {
        this.labelElement.style.display = "unset";
        this.keys = [];
        this._onClear.raise();
        const keyElements = this.querySelectorAll(".key");
        keyElements.forEach(e => e.remove());
    }

    private async startInternal(): Promise<void> {
        if (this.currentRecordingSessionId) return;
        this.classList.add("recording");
        this.labelElement.innerHTML = "Recording...";
        this.indicatorElement.innerHTML = "Stop recording";
        this.currentRecordingSessionId = await window.functions.startKeyRecordingSession();
    }
}

customElements.define("ms-keyrecorder", KeyRecorder);
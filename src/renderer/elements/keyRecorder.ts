import Keys from "../../shared/keys";
import { Event, ExposedEvent } from "../../shared/events";

const NO_KEY_DESC = "No Keybind";

export default class KeyRecorder extends HTMLElement {
    private labelElement!: HTMLSpanElement;
    private indicatorElement!: HTMLSpanElement;

    private _isRecording = false;
    private recordingBuffer: number[] = [];

    private _onStartRecording = new Event<void>;
    get onStartRecording(): ExposedEvent<void> { return this._onStartRecording.expose(); }

    private _onStopRecording = new Event<void>;
    get onStopRecording(): ExposedEvent<void> { return this._onStopRecording.expose(); }

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

    get isRecording(): boolean { return this._isRecording; }

    handleKeyDown = (key: number): void => {
        if (!this.isRecording) return;
        if (!this.recordingBuffer.includes(key)) {
            this.recordingBuffer.push(key);
        }
        this.keys = [];
    };

    handleKeyUp = (key: number): void => {
        if (!this.isRecording) return;
        this.recordingBuffer.splice(this.recordingBuffer.indexOf(key), 1);
    };

    protected connectedCallback(): void {
        // if (this.connected) return;
        // this.connected = true;

        const label = document.createElement("span");
        label.classList.add("keyrecorder-label");
        label.innerHTML = NO_KEY_DESC;
        this.labelElement = label;

        const indicator = document.createElement("span");
        indicator.classList.add("keyrecorder-indicator");
        indicator.innerHTML = "Record keybind";
        this.indicatorElement = indicator;

        this.append(label, indicator);

        window.onclick = (e): void => {
            if (e.composedPath().includes(this)) {
                if (this.isRecording) this.stop();
                else this.start();
            } else this.stop();
        };

        // TODO: Replace with preloader events
        // ipcRenderer.on("key.down", this.handleKeyDown);
        // ipcRenderer.on("key.up", this.handleKeyUp);

        this.oncontextmenu = (): void => { this.clear(); };

        this.setDisplayedKeys(Keys.toKeyStringArray(this.keys));
    }

    protected disconnectedCallback(): void {
        // TODO: Replace with preloader events
        // ipcRenderer.removeListener("key.down", this.handleKeyDown);
        // ipcRenderer.removeListener("key.up", this.handleKeyUp);
        this.oncontextmenu = null;
    }

    start(): void {
        if (this.isRecording) return;
        this._isRecording = true;
        this.classList.add("recording");
        this.labelElement.innerHTML = "Recording...";
        this.indicatorElement.innerHTML = "Stop recording";
        // MS.instance.recordingKey = true; // TODO: Check if necessary

        this._onStartRecording.raise();
        // ipcRenderer.send("key.startRecording"); // TODO: Handle key recording via preload
    }

    stop(): void {
        if (!this.isRecording) return;
        this._isRecording = false;
        this.classList.remove("recording");
        this.labelElement.innerHTML = NO_KEY_DESC;
        this.indicatorElement.innerHTML = "Record keybind";
        // MS.instance.recordingKey = false; // TODO: Check if necessary

        this._onStopRecording.raise();
        // ipcRenderer.send("key.stopRecording"); // TODO: Handle key recording via preload
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
}
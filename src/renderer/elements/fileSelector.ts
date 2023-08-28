import { Event, ExposedEvent } from "../../shared/events";

export default class FileSelector extends HTMLElement {
    readonly hint: string;
    readonly type: "folder" | "sound";

    get onValueChanged(): ExposedEvent<string> { return this._onValueChanged.expose(); }
    private _onValueChanged = new Event<string>();

    private _value = "";
    get value(): string {
        return this._value;
    }
    set value(v: string) {
        this._value = v;
        if (this.isConnected) this.inputElement.value = v;
    }

    private inputElement!: HTMLInputElement;

    constructor(hint: string, type: "folder");
    constructor(hint: string, type: "sound");
    constructor(hint: string, type: "folder" | "sound") {
        super();
        this.hint = hint;
        this.type = type;
    }

    protected connectedCallback(): void {
        this.inputElement = document.createElement("input");
        this.inputElement.type = "text";
        this.inputElement.placeholder = this.hint;
        this.inputElement.value = this.value;
        this.inputElement.classList.add("fileselector-input");

        this.inputElement.addEventListener("change", () => {
            this.value = this.inputElement.value;
            this._onValueChanged.raise(this.value);
        });

        const button = document.createElement("button");
        button.classList.add("fileselector-button");
        button.onclick = (): void => void this.browseFile();
        button.innerHTML = "folder";

        this.append(this.inputElement, button);
    }

    async browseFile(): Promise<void> {
        if (this.type == "sound") {
            const paths = await window.actions.browseSounds();
            if (paths.length > 0) {
                this.value = paths[0]!;
            }
        }
        else {
            const path = await window.actions.browseFolder();
            if (path) this.value = path;
        }
    }

    warn(): void {
        if (this.inputElement.classList.contains("warn")) return;
        this.inputElement.classList.add("warn");
        setTimeout(() => {
            this.inputElement.classList.remove("warn");
        }, 400);
    }
}

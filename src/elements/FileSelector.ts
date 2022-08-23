import { ipcRenderer } from "electron";
import { Event, ExposedEvent } from "../util/Event";
import { promises as fs, constants as fsConstants } from "fs";
import path = require("path");

export default class FileSelector extends HTMLElement {
    readonly hint: string;
    readonly type: "folder" | "file";
    readonly typeName: string;
    readonly extensions: string[];

    get onValueChanged(): ExposedEvent<string> { return this._onValueChanged.expose(); }
    private _onValueChanged = new Event<string>();

    private _value = "";
    get value(): string {
        return this._value;
    }
    set value(v: string) {
        this._value = v;
        if (this.inputElement) this.inputElement.value = v;
        this._onValueChanged.raise(v);
    }

    private inputElement: HTMLInputElement | null = null;

    constructor(hint: string, type: "folder" | "file", typeName: string, extensions: string[]) {
        super();
        this.hint = hint;
        this.type = type;
        this.extensions = extensions;
        this.typeName = typeName;
    }

    protected connectedCallback(): void {
        this.inputElement = document.createElement("input");
        this.inputElement.type = "text";
        this.inputElement.placeholder = this.hint;
        this.inputElement.value = this.value;
        this.inputElement.classList.add("fileselector-input");

        const button = document.createElement("button");
        button.classList.add("fileselector-button");
        button.onclick = (): void => void this.browseFile();
        button.innerHTML = "folder";

        this.append(this.inputElement, button);
    }

    async browseFile(): Promise<void> {
        if (this.type == "file") {
            const paths = await ipcRenderer.invoke("file.browse", false, this.typeName, this.extensions) as string[];
            if (paths.length > 0) {
                this.value = paths[0];
            }
        }
        else {
            const path = await ipcRenderer.invoke("folder.browse") as string;
            if (path) this.value = path;
        }
    }

    warn(): void {
        if (!this.inputElement) return;
        if (this.inputElement.classList.contains("warn")) return;
        this.inputElement.classList.add("warn");
        setTimeout(() => {
            this.inputElement?.classList.remove("warn");
        }, 400);
    }

    /** Verifies if the path is not empty, the file/folder exists, and if it is within the accepted extensions. */
    async isPathValid(): Promise<boolean> {
        try {
            await fs.access(this.value, fsConstants.F_OK);
        } catch (error) {
            return false;
        }

        const s = await fs.stat(this.value);
        if (this.type == "file") {
            if (s.isDirectory()) return false;

            const ext = path.extname(this.value).substring(1);
            return this.extensions.includes(ext) || this.extensions.length == 0;

        } else {
            return s.isDirectory();
        }
    }
}
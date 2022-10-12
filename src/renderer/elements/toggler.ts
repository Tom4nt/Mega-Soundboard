import { InfoBalloon } from "../elements";
import { Event, ExposedEvent } from "../../shared/events";

export default class Toggler extends HTMLElement {
    private _isOn = false;
    private labelText = "";
    private containerElement!: HTMLDivElement;
    private pointerElement!: HTMLDivElement;

    private _onToggle = new Event<Toggler>();
    public get onToggle(): ExposedEvent<Toggler> { return this._onToggle.expose(); }

    constructor(label: string, private infoElement?: InfoBalloon) {
        super();
        this.labelText = label;
    }

    protected connectedCallback(): void {
        const div = document.createElement("div");
        div.classList.add("toggler-box");
        this.containerElement = div;

        const content = document.createElement("div");
        content.classList.add("toggler-pointer");
        this.pointerElement = content;

        if (this.isOn) {
            this.pointerElement.classList.add("toggled");
            this.containerElement.classList.add("toggled");
        }

        div.append(content);

        const label = document.createElement("span");
        label.innerHTML = this.getAttribute("text") ?? this.labelText;
        label.classList.add("toggler-label");

        this.append(div, label);
        if (this.infoElement) this.append(this.infoElement);
        this.onclick = (): void => {
            this.toggle();
        };
    }

    toggle(): void {
        this.isOn = !this.isOn;
        this._onToggle.raise(this);
    }

    get isOn(): boolean {
        return this._isOn;
    }

    set isOn(value: boolean) {
        this._isOn = value;
        if (!this.isConnected) return;
        if (value) {
            this.pointerElement.classList.add("toggled");
            this.containerElement.classList.add("toggled");
        } else {
            this.pointerElement.classList.remove("toggled");
            this.containerElement.classList.remove("toggled");
        }
    }
}

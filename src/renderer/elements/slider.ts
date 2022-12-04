import { Event, ExposedEvent } from "../../shared/events";
import { Tooltip } from "../elements";

export default class Slider extends HTMLElement {
    private progressColor: string;
    private mainColor: string;
    private labelText: string;

    private inputElement!: HTMLInputElement;
    private tooltip!: Tooltip;

    public get onValueChange(): ExposedEvent<Slider> { return this._onValueChange.expose(); }
    private readonly _onValueChange = new Event<Slider>();

    private _value = 0;
    get value(): number {
        return this._value;
    }

    set value(num: number) {
        if (num > 100) num = 100;
        if (num < 0) num = 0;

        this._value = num;
        if (this.isConnected) {
            this.inputElement.value = num.toString();
            this.updateSliderColor();
            this.updateTooltip();
        }
    }

    private get textValue(): string {
        return `${this.value.toString()}%`;
    }

    constructor(labelText: string) {
        super();
        this.progressColor = "var(--color-white)";
        this.mainColor = "var(--color-darkL)";
        this.labelText = labelText;
    }

    protected connectedCallback(): void {
        this.tooltip = new Tooltip();
        this.tooltip.attach(this);

        this.tooltip.domRectGetter = (): DOMRect => this.getThumbDOMRect();

        const labelAttr = this.getAttribute("label");
        if (labelAttr) {
            const label = document.createElement("span");
            label.classList.add("slider-label");
            if (!this.labelText) this.labelText = labelAttr;
            this.appendChild(label);
        }

        const input = document.createElement("input");
        input.classList.add("slider-input");
        input.min = "0";
        input.max = "100";
        input.type = "range";
        this.inputElement = input;
        this.value = this._value;

        input.addEventListener("input", () => {
            this.value = input.valueAsNumber;
        });

        input.addEventListener("change", () => {
            this._onValueChange.raise(this);
        });

        this.append(input);
        this.updateSliderColor();
    }

    protected disconnectedCallback(): void {
        this.tooltip.detach();
    }

    private updateSliderColor(): void {
        this.inputElement.style.background =
            `linear-gradient(to right, ${this.progressColor} 0%, ${this.progressColor} ${this.value}%, ${this.mainColor} ${this.value}%, ${this.mainColor} 100%)`;
    }

    private updateTooltip(): void {
        if (this.labelText) this.tooltip.tooltipText = `${this.labelText} | ${this.textValue}`;
        else this.tooltip.tooltipText = this.textValue;

        this.tooltip.notifyPositionUpdate();
    }

    private getThumbDOMRect(): DOMRect {
        const thisRect = this.getBoundingClientRect();
        const thumbW = 12;
        const w = this.inputElement.clientWidth - thumbW;
        thisRect.x += (w * (this.value / 100)) - w / 2;
        return thisRect;
    }
}

import TooltipElement from "./tooltipElement";
import { Event, ExposedEvent } from "../../shared/events";

export default class Slider extends TooltipElement {
    private progressColor: string;
    private mainColor: string;
    private labelText: string;

    private labelElement!: HTMLSpanElement;
    private inputElement!: HTMLInputElement;

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
        const labelAttr = this.getAttribute("label");
        if (labelAttr) {
            const label = document.createElement("span");
            label.classList.add("slider-label");
            if (!this.labelText) this.labelText = labelAttr;
            this.labelElement = label;
            this.appendChild(label);
        }

        const input = document.createElement("input");
        input.classList.add("slider-input");
        input.min = "0";
        input.max = "100";
        input.type = "range";
        this.inputElement = input;
        this.value = this._value;

        input.oninput = (): void => {
            this.updateSliderColor();
            this.updateTooltip();
            this._onValueChange.raise(this);
        };

        this.append(input);
        this.append(this.labelElement);
        this.updateSliderColor();
    }

    private updateSliderColor(): void {
        this.inputElement.style.background =
            `linear-gradient(to right, ${this.progressColor} 0%, ${this.progressColor} ${this.value}%, ${this.mainColor} ${this.value}%, ${this.mainColor} 100%)`;
    }

    private updateTooltip(): void {
        if (this.labelText) this.tooltipText = `${this.labelText} | ${this.textValue}`;
        else this.tooltipText = this.textValue;

        if (this.tooltipElement) {
            const left = this.getThumbX() - this.tooltipElement.offsetWidth / 2;
            this.tooltipElement.style.left = left.toString() + "px";
        }
    }

    private getThumbX(): number {
        const input = this.inputElement;
        const x = input.getBoundingClientRect().x;
        const slider_width = input.clientWidth;
        const center_position = slider_width / 2;
        const percent_of_range = this.value / 100;
        const value_px_position = percent_of_range * slider_width;
        const dist_from_center = value_px_position - center_position;
        const percent_dist_from_center = dist_from_center / center_position;
        const offset = percent_dist_from_center * 6;
        return value_px_position - offset + x;
    }
}
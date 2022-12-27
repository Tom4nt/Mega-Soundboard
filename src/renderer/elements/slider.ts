import { Event, ExposedEvent } from "../../shared/events";
import { Tooltip } from "../elements";

export default class Slider extends HTMLElement {
    private didConnect = false;
    private progressColor: string;
    private mainColor: string;
    private labelText: string;

    private inputElement!: HTMLInputElement;
    private tooltip?: Tooltip;

    public get onValueChange(): ExposedEvent<Slider> { return this._onValueChange.expose(); }
    private readonly _onValueChange = new Event<Slider>();

    get value(): number { return Number(this.inputElement.value); }
    set value(num: number) {
        this.inputElement.value = num.toString();
        this.update();
    }

    get min(): number { return Number(this.inputElement.min); }
    set min(num: number) { this.inputElement.min = num.toString(); }

    get max(): number { return Number(this.inputElement.max); }
    set max(num: number) { this.inputElement.max = num.toString(); }

    get step(): number | null {
        const val = Number(this.inputElement.step);
        if (isNaN(val)) return null;
        return val;
    }
    set step(val: number | null) {
        this.inputElement.step = val ? val.toString() : "any";
    }

    private get textValue(): string {
        return `${this.inputElement.value}%`;
    }

    constructor(labelText: string) {
        super();
        this.progressColor = "var(--color-white)";
        this.mainColor = "var(--color-darkL)";
        this.labelText = labelText;
        this.inputElement = document.createElement("input");
        this.inputElement.min = "0";
        this.inputElement.max = "100";
    }

    protected connectedCallback(): void {
        const labelAttr = this.getAttribute("label");
        if (!this.labelText && labelAttr) this.labelText = labelAttr;

        if (this.labelText) {
            this.tooltip = new Tooltip();
            this.tooltip.attach(this);
            this.tooltip.domRectGetter = (): DOMRect => this.getThumbDOMRect();
        }

        if (this.didConnect) return;

        this.inputElement.classList.add("slider-input");
        this.inputElement.type = "range";

        this.inputElement.addEventListener("input", () => {
            this.update();
        });

        this.inputElement.addEventListener("change", () => {
            this._onValueChange.raise(this);
        });

        this.append(this.inputElement);
        this.update();
        this.didConnect = true;
    }

    protected disconnectedCallback(): void {
        this.tooltip?.detach();
    }

    private update(): void {
        if (this.isConnected) {
            this.updateSliderColor();
            this.updateTooltip();
        }
    }

    private updateSliderColor(): void {
        const percentVal = (this.value / (this.max - this.min)) * 100;
        this.inputElement.style.background =
            `linear-gradient(to right, ${this.progressColor} 0%, ${this.progressColor} ${percentVal}%,
                 ${this.mainColor} ${percentVal}%, ${this.mainColor} 100%)`;
    }

    private updateTooltip(): void {
        if (!this.tooltip) return;
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

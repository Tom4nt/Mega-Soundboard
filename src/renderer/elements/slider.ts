import { Event, ExposedEvent } from "../../shared/events";
import { Tooltip } from "../elements";

export default class Slider extends HTMLElement {
	private didConnect = false;
	private progressColor: string;
	private mainColor: string;

	private inputElement!: HTMLInputElement;
	private tooltip?: Tooltip;

	private readonly _onValueChange = new Event<Slider>();
	public get onValueChange(): ExposedEvent<Slider> { return this._onValueChange.expose(); }

	private readonly _onInput = new Event<Slider>();
	public get onInput(): ExposedEvent<Slider> { return this._onInput.expose(); }

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

	constructor(public labelTextGenerator?: (value: number) => string, max: number = 100) {
		super();
		this.progressColor = "var(--color-white)";
		this.mainColor = "var(--color-darkL)";
		this.inputElement = document.createElement("input");
		this.inputElement.min = "0";
		this.inputElement.max = max.toString();
	}

	protected connectedCallback(): void {
		this.tooltip = new Tooltip();
		this.tooltip.attach(this);
		this.tooltip.domRectGetter = (): DOMRect => this.getThumbDOMRect();

		if (this.didConnect) return;

		this.inputElement.classList.add("slider-input");
		this.inputElement.type = "range";

		this.inputElement.addEventListener("input", () => {
			this.update();
			this._onInput.raise(this);
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
		const percentVal = ((this.value - this.min) / (this.max - this.min)) * 100;
		this.inputElement.style.background =
			`linear-gradient(to right, ${this.progressColor} 0%, ${this.progressColor} ${percentVal}%,
                 ${this.mainColor} ${percentVal}%, ${this.mainColor} 100%)`;
	}

	private updateTooltip(): void {
		if (!this.tooltip) return;
		if (this.labelTextGenerator) this.tooltip.tooltipText = this.labelTextGenerator(this.value);
		this.tooltip.isEnabled = this.labelTextGenerator !== undefined;
		this.tooltip.notifyPositionUpdate();
	}

	private getThumbDOMRect(): DOMRect {
		const thisRect = this.getBoundingClientRect();
		const thumbW = 12;
		const w = this.inputElement.clientWidth - thumbW;
		thisRect.x += (w * ((this.value - this.min) / (this.max - this.min))) - w / 2;
		return thisRect;
	}
}

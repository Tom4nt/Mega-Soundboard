import { MS, Side } from "../Models";

export default abstract class TooltipElement extends HTMLElement {
    protected tooltipElement: HTMLDivElement | null = null;

    protected side: Side = "top";

    private _tooltipText: string | null = null;
    protected get tooltipText(): string | null {
        return this._tooltipText;
    }
    protected set tooltipText(value: string | null) {
        this._tooltipText = value;
        this.updateTooltipText(value);
    }

    protected connectedCallback(): void {
        this.addEventListener("mouseenter", () => {
            this.updateTooltipText(this.tooltipText);
        });

        this.addEventListener("mouseleave", () => {
            this.updateTooltipText(null);
        });
    }

    protected disconnectedCallback(): void {
        this.updateTooltipText(null);
    }

    private updateTooltipText(text: string | null): void {
        if (!this.tooltipElement && text)
            this.tooltipElement = MS.openPopup(text, this.getBoundingClientRect(), this.side);
        else if (this.tooltipElement && !text) {
            MS.closePopup(this.tooltipElement);
            this.tooltipElement = null;
        } else if (this.tooltipElement && text) {
            this.tooltipElement.innerHTML = text;
        }
    }
}
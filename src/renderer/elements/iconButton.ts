import TooltipWrapper from "../util/tooltipWrapper";
import { Side, sides } from "../models";

export default class IconButton extends HTMLElement {
    private tooltipWrapper = new TooltipWrapper(this);

    private _isRed = false;
    set isRed(value: boolean) {
        this._isRed = value;
        if (value) {
            this.classList.add("red");
        } else {
            this.classList.remove("red");
        }
    }

    get isRed(): boolean {
        return this._isRed;
    }

    protected connectedCallback(): void {
        if (this.hasAttribute("red")) {
            this.classList.add("red");
        }

        if (this.hasAttribute("tooltip-text")) {
            this.tooltipWrapper.tooltip.tooltipText = this.getAttribute("tooltip-text") as string;
        }

        if (this.hasAttribute("tooltip-side")) {
            const sideParam = typeof this.getAttribute("tooltip-side") as Side;
            if (sides.includes(sideParam)) {
                this.tooltipWrapper.tooltip.side = sideParam;
            }
        }
    }
}

customElements.define("ms-iconbutton", IconButton);

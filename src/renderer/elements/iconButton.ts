import { Tooltip } from "../elements";
import { Side, sides } from "../models";

export default class IconButton extends HTMLElement {
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
        const tooltip = new Tooltip();
        tooltip.attatch(this);

        if (this.hasAttribute("red")) {
            this.classList.add("red");
        }

        if (this.hasAttribute("tooltip-text")) {
            tooltip.tooltipText = this.getAttribute("tooltip-text") as string;
        }

        if (this.hasAttribute("tooltip-side")) {
            const sideParam = this.getAttribute("tooltip-side") as Side;
            if (sides.includes(sideParam)) {
                tooltip.side = sideParam;
            }
        }
    }
}


import { Tooltip } from "../elements";
import { Side, sides } from "../models";

export default class IconButton extends HTMLElement {
    private iconElement!: HTMLElement;
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

    public setIcon(icon: string): void {
        this.iconElement.innerText = icon;
    }

    protected connectedCallback(): void {
        const icon = document.createElement("i");
        this.iconElement = icon;

        if (this.hasAttribute("icon")) {
            icon.innerText = this.getAttribute("icon")!;
        }

        if (this.hasAttribute("red")) {
            this.classList.add("red");
        }

        if (this.hasAttribute("tooltip-text")) {
            const tooltip = new Tooltip();
            tooltip.attach(this);

            tooltip.tooltipText = this.getAttribute("tooltip-text") as string;

            if (this.hasAttribute("tooltip-side")) {
                const sideParam = this.getAttribute("tooltip-side") as Side;
                if (sides.includes(sideParam)) {
                    tooltip.side = sideParam;
                }
            }
        }

        this.append(icon);
    }
}

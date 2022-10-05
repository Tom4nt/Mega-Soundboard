import { Side } from "../models";

export default class Tooltip extends HTMLElement {

    private _tooltipText: string;
    get tooltipText(): string {
        return this._tooltipText;
    }
    set tooltipText(value: string) {
        this._tooltipText = value;
        this.update();
    }

    private _side: Side;
    get side(): Side {
        return this._side;
    }
    set side(value: Side) {
        this._side = value;
        this.update();
    }

    constructor(readonly rect: DOMRect) {
        super();
        this._tooltipText = "";
        this._side = "top";
    }

    show(): void {
        this.style.opacity = "";
        this.style.transform = "";
    }

    hide(): void {
        this.style.opacity = "0";
        this.style.transform = "scale(0.8)";
    }

    protected connectedCallback(): void {
        this.classList.add("popup");
        this.classList.add(this.side);

        this.hide();
    }

    private update(): void {
        this.innerHTML = this.tooltipText;
        this.updatePosition();
    }

    private updatePosition(): void {
        const centerX = this.rect.x + this.rect.width / 2;
        let left = centerX - (this.offsetWidth / 2); // Center
        if (this.side == "left") left = this.rect.x - this.offsetWidth - 12;
        if (this.side == "right") left = this.rect.x + this.rect.width + 12;

        this.style.left = `${left}px`;

        let top = this.rect.y + (this.rect.height - this.offsetHeight) / 2; // Middle
        if (this.side == "bottom") top = this.rect.y + this.rect.height + 12;
        if (this.side == "top") top = this.rect.y - this.offsetHeight - 12;

        this.style.top = `${top}px`;
    }
}

customElements.define("ms-tooltip", Tooltip);
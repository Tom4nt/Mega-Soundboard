import { Side } from "../models";

export default class Tooltip extends HTMLElement {
    private lastRect?: DOMRect;
    private host?: HTMLElement;

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
        this.classList.remove(this.side);
        this._side = value;
        this.classList.add(this.side);
        this.update();
    }

    constructor() {
        super();
        this._tooltipText = "";
        this._side = "top";
    }

    attatch(host: HTMLElement): void {
        this.host = host;
        host.addEventListener("mouseenter", this.hostMouseEnter);
        host.addEventListener("mouseleave", this.hostMouseLeave);
    }

    remove(): void {
        this.hide();
        this.host?.removeEventListener("mouseenter", this.hostMouseEnter);
        this.host?.removeEventListener("mouseleave", this.hostMouseLeave);
    }

    show(rect: DOMRect): void {
        const layer = document.getElementById("tooltip-layer") as HTMLDivElement;
        layer.append(this);

        this.lastRect = rect;
        this.updatePosition(rect);

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
        if (this.lastRect) this.updatePosition(this.lastRect);
    }

    private updatePosition(rect: DOMRect): void {
        const centerX = rect.x + rect.width / 2;
        let left = centerX - (this.offsetWidth / 2); // Center
        if (this.side == "left") left = rect.x - this.offsetWidth - 12;
        if (this.side == "right") left = rect.x + rect.width + 12;

        this.style.left = `${left}px`;

        let top = rect.y + (rect.height - this.offsetHeight) / 2; // Middle
        if (this.side == "bottom") top = rect.y + rect.height + 12;
        if (this.side == "top") top = rect.y - this.offsetHeight - 12;

        this.style.top = `${top}px`;
    }

    // --- Handlers ---

    hostMouseEnter = (): void => {
        if (this.host) this.show(this.host.getBoundingClientRect());
    };

    hostMouseLeave = (): void => {
        this.hide();
    };
}

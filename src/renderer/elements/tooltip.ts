import { Side } from "../models";

export default class Tooltip extends HTMLElement {
    private lastRect?: DOMRect;
    private host?: HTMLElement;
    private isShown = false;

    private _tooltipText: string;
    get tooltipText(): string {
        return this._tooltipText;
    }
    set tooltipText(value: string) {
        this._tooltipText = value;
        this.update();
    }

    private _isEnabled = true;
    get isEnabled(): boolean { return this._isEnabled; }
    set isEnabled(val: boolean) {
        this._isEnabled = val;
        if (!val) this.hide();
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

    public domRectGetter: (() => DOMRect) | null = null;
    public isAutomatic = true;

    constructor() {
        super();
        this._tooltipText = "";
        this._side = "top";

        this.style.opacity = "0";
        this.style.transform = "scale(0.8)";

        this.classList.add("popup");
        this.classList.add(this.side);
    }

    attach(host: HTMLElement): void {
        this.host = host;
        host.addEventListener("mouseenter", this.hostMouseEnter);
        host.addEventListener("mouseleave", this.hostMouseLeave);
    }

    detach(): void {
        this.hide();
        this.host?.removeEventListener("mouseenter", this.hostMouseEnter);
        this.host?.removeEventListener("mouseleave", this.hostMouseLeave);
    }

    show(): void {
        if (!this.isEnabled) return;

        this.isShown = true;
        const layer = document.getElementById("tooltip-layer") as HTMLDivElement;
        layer.append(this);

        const r = this.getPreferedDOMRect();
        this.lastRect = r;
        this.updatePosition(r);

        this.style.opacity = "";
        this.style.transform = "";
    }

    hide(): void {
        if (!this.isShown) return;
        this.isShown = false;
        this.style.opacity = "0";
        this.style.transform = "scale(0.8)";
        setInterval(this.removeHandler, 150);
    }

    notifyPositionUpdate(): void {
        if (this.host) this.updatePosition(this.getPreferedDOMRect());
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

    private getPreferedDOMRect(): DOMRect {
        if (!this.host) throw Error("Host is not defined.");
        return this.domRectGetter ? this.domRectGetter() : this.host.getBoundingClientRect();
    }

    // --- Handlers ---

    hostMouseEnter = (): void => {
        if (this.host && this.isAutomatic) this.show();
    };

    hostMouseLeave = (): void => {
        if (this.isAutomatic) this.hide();
    };

    removeHandler = (): void => {
        if (this.isShown) return;
        this.remove();
    };
}

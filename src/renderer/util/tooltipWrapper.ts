import { Tooltip } from "../elements";
import { Side } from "../models";

export default class TooltipWrapper {
    readonly tooltip: Tooltip;

    get tooltipText(): string { return this.tooltip.tooltipText; }
    set tooltipText(v: string) { this.tooltip.tooltipText = v; }

    constructor(readonly host: HTMLElement, side: Side, initialText: string) {
        this.tooltip = new Tooltip(side, host.getBoundingClientRect(), initialText);

        const layer = document.getElementById("tooltip-layer") as HTMLDivElement;
        layer.append(this.tooltip);

        this.host.addEventListener("mouseenter", () => {
            this.tooltip.show();
        });

        this.host.addEventListener("mouseleave", () => {
            this.tooltip.hide();
        });
    }
}
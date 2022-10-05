import { Tooltip } from "../elements";

export default class TooltipWrapper {
    readonly tooltip: Tooltip;

    constructor(readonly host: HTMLElement) {
        this.tooltip = new Tooltip(host.getBoundingClientRect());

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

import { Side } from "../../shared/models";
import { Tooltip } from "../elements";

export default class TooltipWrapper {
    readonly tooltip: Tooltip;

    constructor(readonly host: HTMLElement, side: Side, initialText: string) {
        this.tooltip = new Tooltip(side, host.getBoundingClientRect(), initialText);
        // TODO: Connect tooltip to tooltipLayer

        this.host.addEventListener("mouseenter", () => {
            this.tooltip.show();
        });

        this.host.addEventListener("mouseleave", () => {
            this.tooltip.hide();
        });
    }
}
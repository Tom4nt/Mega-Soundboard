import { Side } from "../models";
import TooltipWrapper from "../util/tooltipWrapper";

export default class InfoBalloon extends HTMLElement {
    constructor(readonly tooltipText: string, readonly side: Side) {
        super();
    }

    protected connectedCallback(): void {
        const tt = new TooltipWrapper(this);
        tt.tooltip.tooltipText = this.tooltipText;
        tt.tooltip.side = this.side;
        this.innerHTML = "i";
    }
}

customElements.define("ms-infoballoon", InfoBalloon);
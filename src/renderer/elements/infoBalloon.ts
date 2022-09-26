import { Side } from "../models";
import TooltipWrapper from "../util/tooltipWrapper";

export default class InfoBalloon extends HTMLElement {
    constructor(readonly tooltipText: string, readonly side: Side) {
        super();
    }

    protected connectedCallback(): void {
        new TooltipWrapper(this, this.side, this.tooltipText);
        this.innerHTML = "i";
    }
}
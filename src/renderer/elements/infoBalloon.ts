import TooltipElement from "./tooltipElement";
import { Side } from "../../shared/models";

export default class InfoBalloon extends TooltipElement {
    constructor(text: string, side: Side) {
        super();
        this.side = side;
        this.tooltipText = text;
    }

    protected connectedCallback(): void {
        this.innerHTML = "i";
    }
}
import { Tooltip } from "../elements";
import { Side } from "../models";

export default class InfoBalloon extends HTMLElement {
    constructor(readonly tooltipText: string, readonly side: Side) {
        super();
    }

    protected connectedCallback(): void {
        const tt = new Tooltip();
        tt.tooltipText = this.tooltipText;
        tt.side = this.side;
        tt.attach(this);

        this.innerHTML = "i";
    }
}

import { Modal } from "../modals";

export default class MessageModal extends Modal {

    constructor(public readonly title: string, public readonly text: string, isError: boolean) {
        super(isError);
        this.modalTitle = title;
    }

    // eslint-disable-next-line class-methods-use-this
    protected canCloseWithKey(): boolean {
        return true;
    }

    protected getContent(): HTMLElement {
        const p = document.createElement("p");
        p.innerHTML = this.text;
        return p;
    }

    protected getFooterButtons(): HTMLButtonElement[] {
        const buttons = [
            Modal.getButton("ok", () => this.close()),
        ];
        return buttons;
    }
}

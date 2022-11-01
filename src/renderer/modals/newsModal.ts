import { Modal } from "../modals";

export default class NewsModal extends Modal {
    private content!: string;

    constructor() {
        super(false);
        this.modalTitle = "What's New";
    }

    /** Async factory method */
    static async load(): Promise<NewsModal> {
        const modal = new NewsModal();
        modal.content = await window.actions.getNewsHtml();
        return modal;
    }

    // eslint-disable-next-line class-methods-use-this
    protected canCloseWithKey(): boolean {
        return true;
    }

    getContent(): HTMLElement {
        const d = document.createElement("div");
        d.classList.add("news");
        d.innerHTML = this.content;

        return d;
    }

    getFooterButtons(): HTMLButtonElement[] {
        const buttons = [
            Modal.getButton("Close", () => { this.close(); }, false, false),
        ];

        return buttons;
    }
}

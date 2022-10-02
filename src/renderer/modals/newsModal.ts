import { Modal } from "../modals";

export default class NewsModal extends Modal {
    private content!: string;

    private constructor() {
        super(false);
        this.modalTitle = "What's New";
    }

    /** Async factory method */
    static load(): NewsModal {
        const modal = new NewsModal();
        // TODO: Make this a main process task
        // modal.content = await fs.readFile(__dirname + "/../../news.html", "utf-8");
        modal.content = "";
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

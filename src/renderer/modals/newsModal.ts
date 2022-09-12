import { Modal } from "../modals";
import { promises as fs } from "fs"; // TODO: Remove reference

export default class NewsModal extends Modal {
    private content!: string;

    private constructor() {
        super(false);
        this.modalTitle = "What's New";
    }

    /** Async factory method */
    static async load(): Promise<NewsModal> {
        const modal = new NewsModal();
        // TODO: Make this a main process task
        modal.content = await fs.readFile(__dirname + "/../../news.html", "utf-8");
        return modal;
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

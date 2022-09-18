import { Modal } from "./modals";

export default class ModalManager {
    private modalHolder: HTMLDivElement;
    private openModalCount = 0;

    constructor() {
        this.modalHolder = document.createElement("div");
        document.body.append(this.modalHolder);
    }

    get hasOpenModal(): boolean { return false; } // TODO: Implement

    openMessageModal(text: string): void {
        // TODO
    }

    openModal(modal: Modal): void {
        this.modalHolder.append(modal);
        this.openModalCount++;
    }

    closeModal(modal: Modal): void {
        modal.remove();
        this.openModalCount--;
    }
}
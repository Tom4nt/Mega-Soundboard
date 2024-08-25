import { Modal } from "./modals";

export default class ModalManager {
	private modalHolder: HTMLDivElement;
	private openModalCount = 0;

	constructor() {
		this.modalHolder = document.createElement("div");
		if (document.readyState == "complete") {
			document.body.append(this.modalHolder);
		} else {
			window.addEventListener("load", () => {
				document.body.append(this.modalHolder);
			});
		}
	}

	get hasOpenModal(): boolean { return this.openModalCount > 0; }

	openModal(modal: Modal): void {
		this.modalHolder.append(modal);
		this.openModalCount++;
	}

	closeModal(modal: Modal): void {
		modal.remove();
		this.openModalCount--;
	}
}

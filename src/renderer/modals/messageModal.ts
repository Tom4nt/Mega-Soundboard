import { Modal } from "../modals";

export default class MessageModal extends Modal {

	constructor(public readonly title: string, public readonly text: string, isError: boolean) {
		super(isError);
		this.modalTitle = title;
	}

	protected canCloseWithKey(): boolean {
		return true;
	}

	protected getContent(): HTMLElement[] {
		const p = document.createElement("p");
		p.innerHTML = this.text;
		return [p];
	}

	protected getFooterButtons(): HTMLButtonElement[] {
		const buttons = [
			Modal.getButton("ok", () => void this.close()),
		];
		return buttons;
	}
}

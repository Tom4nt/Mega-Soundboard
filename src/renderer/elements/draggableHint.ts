import { calls } from "../../shared/decorators";

const copyIcon = "file_copy";
const moveIcon = "drive_file_move";
const blockIcon = "block";

export default class DraggableHint extends HTMLElement {
	@calls("render")
	public accessor canMove: boolean = false;

	@calls("render")
	accessor canCopy: boolean = false;

	@calls("render")
	accessor prefersCopy: boolean = false;

	@calls("render")
	accessor destinationName: string = "";

	protected connectedCallback(): void {
		this.render();
	}

	render(): void {
		this.innerHTML = "";

		const iconElement = document.createElement("i");
		iconElement.id = "icon";
		const textSpan = document.createElement("span");
		textSpan.id = "text";

		const [icon, text] = this.getIconAndText();
		if (!text) {
			this.hidden = true;
			return;
		}
		this.hidden = false;

		iconElement.textContent = icon;
		textSpan.textContent = text;

		this.append(iconElement, textSpan);
	}

	private getIconAndText(): [string, string] {
		let text = "";
		let icon = "";

		if (!this.canCopy && !this.canMove) {
			text = `Cannot ${this.prefersCopy ? "copy" : "move"}`;
			icon = blockIcon;
		}

		if (this.canCopy && this.prefersCopy) {
			text = "Copy";
			icon = copyIcon;
		}

		if (this.destinationName) {
			if (!text) {
				text = "Move";
				icon = moveIcon;
			}
			text += ` to ${this.destinationName}`;
		}
		return [icon, text];
	}
}

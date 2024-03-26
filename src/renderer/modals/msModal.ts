import { UpdaterState } from "../../shared/interfaces";
import { Modal, NewsModal } from "../modals";

export default class MSModal extends Modal {
	versionElement!: HTMLHeadingElement;
	updateButton!: HTMLButtonElement;
	updateInfoElement!: HTMLParagraphElement;

	isUpdateReady = false;
	isListeningToUpdateReady = false;

	constructor() {
		super(false);
		this.modalTitle = "Mega Soundboard";
	}

	// eslint-disable-next-line class-methods-use-this
	protected canCloseWithKey(): boolean {
		return true;
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();
		if (this.isListeningToUpdateReady)
			window.events.updateStateChanged.removeHandler(this.handleUpdateStateChanged);
	}

	getContent(): HTMLElement[] {
		const icon = document.createElement("img");
		icon.src = "icon.ico";
		icon.style.display = "block";
		icon.style.margin = "auto";
		icon.style.marginBottom = "8px";
		icon.style.height = "64px";

		const ver = document.createElement("h4");
		ver.style.textAlign = "center";
		ver.style.marginBottom = "22px";
		this.versionElement = ver;

		const buttons = document.createElement("div");
		buttons.style.display = "grid";
		buttons.style.gap = "8px";
		buttons.style.gridTemplateColumns = "repeat(2, 130px)";
		buttons.style.justifyContent = "center";

		const btnGitHub = document.createElement("button");
		btnGitHub.innerHTML = "<span>GitHub<i>open_in_browser</i></span>";
		btnGitHub.onclick = (): void => void window.actions.openRepo();

		const btnReport = document.createElement("button");
		btnReport.innerHTML = "<span>Feedback<i>open_in_browser</i></span>";
		btnReport.onclick = (): void => void window.actions.openFeedback();

		const btnChanges = document.createElement("button");
		btnChanges.innerHTML = "<span>What's New</span>";
		btnChanges.onclick = async (): Promise<void> => {
			this.close();
			if (!this.parentElement) return;
			const newsModal = await NewsModal.load();
			newsModal.open();
		};

		this.updateInfoElement = document.createElement("p");
		this.updateInfoElement.style.display = "none";
		this.updateInfoElement.style.textAlign = "center";

		const btnCheckUpdates = document.createElement("button");
		btnCheckUpdates.innerHTML = "<span>Check for updates</span>";
		btnCheckUpdates.onclick = async (): Promise<void> => {
			if (this.isUpdateReady) {
				window.actions.installUpdate();
			} else {
				await this.checkUpdate();
			}
		};
		this.updateButton = btnCheckUpdates;

		buttons.append(btnGitHub, btnReport, btnChanges, btnCheckUpdates);
		void this.setVersionNumber();

		return [icon, ver, buttons, this.updateInfoElement];
	}

	getFooterButtons(): HTMLButtonElement[] {
		const buttons = [
			Modal.getButton("Close", () => { this.close(); }, false, false),
		];
		return buttons;
	}

	private async checkUpdate(): Promise<void> {
		this.updateInfoElement.innerText = "Checking...";
		this.updateInfoElement.style.display = "";
		const state = await window.actions.checkUpdate();
		switch (state) {
			case "downloading":
				this.updateInfoElement.innerText = "The update is being downloaded...";
				if (!this.isListeningToUpdateReady)
					window.events.updateStateChanged.addHandler(this.handleUpdateStateChanged);
				this.isListeningToUpdateReady = true;
				break;
			case "downloaded":
				this.showUpdateReady();
				break;
			case "upToDate":
				this.updateInfoElement.innerHTML = "You're up to date!";
				break;
		}
	}

	private async setVersionNumber(): Promise<void> {
		const version = await window.actions.getVersion();
		this.versionElement.innerHTML = `Version ${version}`;
	}

	private showUpdateReady(): void {
		this.updateInfoElement.innerHTML = "Restart to update.";
		this.updateButton.innerHTML = "<span>Restart</span>";
	}

	private handleUpdateStateChanged = (state: UpdaterState): void => {
		if (state == "downloaded") {
			this.isUpdateReady = true;
			this.showUpdateReady();
		}
	};
}

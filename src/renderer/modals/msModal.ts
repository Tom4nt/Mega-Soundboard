import { Modal, NewsModal } from "../modals";

export default class MSModal extends Modal {
    versionElement!: HTMLHeadingElement;

    constructor() {
        super(false);
        this.modalTitle = "Mega Soundboard";
    }

    // eslint-disable-next-line class-methods-use-this
    protected canCloseWithKey(): boolean {
        return true;
    }

    getContent(): HTMLElement {
        const icon = document.createElement("img");
        icon.src = "res/icon.ico";
        icon.style.display = "block";
        icon.style.margin = "auto";
        icon.style.marginBottom = "8px";
        icon.style.height = "64px";

        const ver = document.createElement("h4");
        ver.style.textAlign = "center";
        ver.style.marginBottom = "22px";
        this.versionElement = ver;

        const buttons = document.createElement("div");
        buttons.style.textAlign = "center";

        const btnGitHub = document.createElement("button");
        btnGitHub.innerHTML = "<span>GitHub</span><span class=\"icon\">open_browser</span>";
        btnGitHub.style.marginRight = "8px";
        btnGitHub.onclick = (): void => void window.actions.openRepo();

        const btnReport = document.createElement("button");
        btnReport.innerHTML = "<span>Report a Bug</span><span class=\"icon\">open_browser</span>";
        btnReport.style.marginRight = "8px";
        btnReport.onclick = (): void => void window.actions.openBugReport();

        const btnChanges = document.createElement("button");
        btnChanges.innerHTML = "<span>Changelog</span>";
        btnChanges.onclick = async (): Promise<void> => {
            this.close();
            if (!this.parentElement) return;
            const newsModal = await NewsModal.load();
            newsModal.open();
        };

        buttons.append(btnGitHub, btnReport, btnChanges);

        void this.setVersionNumber();

        const containerElement = document.createElement("div");
        containerElement.append(icon, ver, buttons);
        return containerElement;
    }

    getFooterButtons(): HTMLButtonElement[] {
        const buttons = [
            Modal.getButton("Close", () => { this.close(); }, false, false),
        ];
        return buttons;
    }

    private async setVersionNumber(): Promise<void> {
        const version = await window.functions.getVersion();
        this.versionElement.innerHTML = `Version ${version}`;
    }
}

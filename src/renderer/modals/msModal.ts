import { ipcRenderer } from "electron"; // TODO: Remove reference
import { MS } from "../../shared/models";
import { Modal, NewsModal } from "../modals";

export default class MSModal extends Modal {

    constructor() {
        super(false);
        this.modalTitle = "Mega Soundboard";
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

        const buttons = document.createElement("div");
        buttons.style.textAlign = "center";

        const btnGitHub = document.createElement("button");
        btnGitHub.innerHTML = "<span>GitHub</span><span class=\"icon\">open_browser</span>";
        btnGitHub.style.marginRight = "8px";
        btnGitHub.onclick = (): void => void ipcRenderer.invoke("open.url", "https://github.com/Tom4nt/Mega-Soundboard");

        const btnReport = document.createElement("button");
        btnReport.innerHTML = "<span>Report a Bug</span><span class=\"icon\">open_browser</span>";
        btnReport.style.marginRight = "8px";
        btnReport.onclick = (): void => void ipcRenderer.invoke("open.url", "https://github.com/Tom4nt/Mega-Soundboard/issues/new?assignees=&labels=&template=bug_report.md&title=");

        const btnChanges = document.createElement("button");
        btnChanges.innerHTML = "<span>Changelog</span>";
        btnChanges.onclick = async (): Promise<void> => {
            this.close();
            if (!this.parentElement) return;
            const newsModal = await NewsModal.load();
            newsModal.open(this.parentElement);
        };

        buttons.append(btnGitHub, btnReport, btnChanges);

        void MSModal.setVersionNumber(ver);

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

    private static async setVersionNumber(versionElement: HTMLElement): Promise<void> {
        const version = await MS.getVersion();
        versionElement.innerHTML = `Version ${version}`;
    }
}

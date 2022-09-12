import { MS } from "../../shared/models";
import { ipcRenderer } from "electron"; // TODO: Remove reference

export default class Titlebar extends HTMLElement {
    private dragAreaElement!: HTMLDivElement;
    private sizeButton!: HTMLButtonElement;

    constructor() {
        super();

        ipcRenderer.on("win.maximize", () => {
            this.updateSizeElements(true);
        });

        ipcRenderer.on("win.unmaximize", () => {
            this.updateSizeElements(false);
        });
    }

    connectedCallback(): void {
        const dragArea = document.createElement("div");
        dragArea.classList.add("drag");
        this.dragAreaElement = dragArea;

        const title = document.createElement("span");
        title.innerHTML = this.getAttribute("main") ?? "No Title";

        const btnClose = document.createElement("button");
        const btnSize = document.createElement("button");
        const btnMin = document.createElement("button");

        btnClose.tabIndex = -1;
        btnClose.innerHTML = "close";
        btnClose.classList.add("red");
        btnClose.onclick = (): void => {
            Titlebar.closeWindow();
        };

        btnSize.tabIndex = -1;
        btnSize.innerHTML = "fullscreen";
        btnSize.onclick = (): void => {
            Titlebar.resizeWindow();
        };
        this.sizeButton = btnSize;

        btnMin.tabIndex = -1;
        btnMin.innerHTML = "minimize";
        btnMin.onclick = (): void => {
            Titlebar.minimizeWindow();
        };

        this.append(title, dragArea, btnClose, btnSize, btnMin);
    }

    private static closeWindow(): void {
        ipcRenderer.send("win.close");
    }

    private static resizeWindow(): void {
        ipcRenderer.send("win.size");
    }

    private static minimizeWindow(): void {
        ipcRenderer.send("win.min", MS.instance.settings.minToTray);
    }

    updateSizeElements(isMaximized: boolean): void {
        if (isMaximized) {
            this.sizeButton.innerHTML = "fullscreen_exit";
            this.dragAreaElement.style.top = "0";
        } else {
            this.sizeButton.innerHTML = "fullscreen";
            this.dragAreaElement.style.top = "";
        }
    }
}
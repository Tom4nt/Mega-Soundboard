export default class Titlebar extends HTMLElement {
    private dragAreaElement!: HTMLDivElement;
    private sizeButton!: HTMLButtonElement;

    private isMaximized = false;

    constructor() {
        super();

        // TODO: Listen to preload events. Set isMaximized
        // ipcRenderer.on("win.maximize", () => {
        //     this.updateSizeElements(true);
        // });

        // ipcRenderer.on("win.unmaximize", () => {
        //     this.updateSizeElements(false);
        // });
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
        // TODO: Send events on button click
        // btnClose.onclick = (): void => {
        //     Titlebar.closeWindow();
        // };

        btnSize.tabIndex = -1;
        btnSize.innerHTML = "fullscreen";
        // btnSize.onclick = (): void => {
        //     Titlebar.resizeWindow();
        // };
        this.sizeButton = btnSize;

        btnMin.tabIndex = -1;
        btnMin.innerHTML = "minimize";
        // btnMin.onclick = (): void => {
        //     Titlebar.minimizeWindow();
        // };

        this.append(title, dragArea, btnClose, btnSize, btnMin);
    }

    update(): void {
        if (this.isMaximized) {
            this.sizeButton.innerHTML = "fullscreen_exit";
            this.dragAreaElement.style.top = "0";
        } else {
            this.sizeButton.innerHTML = "fullscreen";
            this.dragAreaElement.style.top = "";
        }
    }
}
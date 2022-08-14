const { ipcRenderer } = require('electron');
const MS = require('../models/MS');

module.exports = class Titlebar extends HTMLElement {
    constructor() {
        super();

        ipcRenderer.on("win.maximize", () => {
            this.resizeWindowHandle(true);
        })

        ipcRenderer.on('win.unmaximize', () => {
            this.resizeWindowHandle(false);
        })
    }

    connectedCallback() {
        const dragArea = document.createElement("div")
        dragArea.classList.add("drag")
        this.dragArea = dragArea

        const title = document.createElement("span")
        title.innerHTML = this.getAttribute("main")

        const btnClose = document.createElement("button")
        const btnSize = document.createElement("button")
        const btnMin = document.createElement("button")

        btnClose.tabIndex = -1
        btnClose.innerHTML = "close"
        btnClose.classList.add("red")
        btnClose.onclick = () => {
            this.closeWindow()
        }

        btnSize.tabIndex = -1
        btnSize.innerHTML = "fullscreen"
        btnSize.onclick = () => {
            this.resizeWindow()
        }
        this.btnSize = btnSize

        btnMin.tabIndex = -1
        btnMin.innerHTML = "minimize"
        btnMin.onclick = () => {
            this.minWindow()
        }

        this.append(title, dragArea, btnClose, btnSize, btnMin);
    }

    closeWindow() {
        ipcRenderer.send("win.close");
    }

    resizeWindow() {
        ipcRenderer.send("win.size");
    }

    resizeWindowHandle(isMax) {
        if (isMax) {
            this.btnSize.innerHTML = "fullscreen_exit";
            this.dragArea.style.top = '0'
        } else {
            this.btnSize.innerHTML = "fullscreen";
            this.dragArea.style.top = null
        }
    }

    minWindow() {
        ipcRenderer.send("win.min", MS.settings.minToTray);
    }
}
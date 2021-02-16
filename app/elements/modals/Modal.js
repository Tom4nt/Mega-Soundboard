const KeybindManager = require('../../models/KeybindManager.js')
const MS = require('../../models/MS.js')

class Modal extends HTMLElement {
    constructor(title, message, isError) {
        super()
        this.lockEsc = false
        this.parent = document.getElementById("content")
        this.title = title
        this.message = message
        this.isError = isError

        this.keyUp = (e) => {
            if (e.key == "Escape" && !this.lockEsc && !MS.recordingKey)
                this.close()
        }

        document.addEventListener("keyup", this.keyUp)
    }

    //#region COMPONENTS

    static getButton(label, clickCallback, left, red) {
        let button = document.createElement("button")
        button.innerHTML = label.toUpperCase()
        if (left)
            button.style.float = "left"
        if (red)
            button.classList.add("button-warn")
        button.onclick = () => { clickCallback() }
        return button;
    }

    static getLabel(text) {
        let label = document.createElement("p");
        label.classList.add("modal-label");
        label.innerHTML = text;
        return label
    }

    static getText(text) {
        let textE = document.createElement("p");
        textE.innerHTML = text
        return textE
    }

    //#endregion

    get title() {
        return this._title.toUpperCase()
    }
    set title(val) {
        this._title = val
        if (this.titleE) this.titleE.innerHTML = "val"
    }

    connectedCallback() {
        this.classList.add("modal")
        if (this.isError) this.classList.add('error')

        const modal = document.createElement("div")
        modal.classList.add("modal-window")
        const dimmer = document.createElement("div")
        dimmer.classList.add("modal-dimmer")
        dimmer.addEventListener("click", () => this.close())

        //Header
        let header = document.createElement("div")
        header.classList.add("modal-header")
        modal.appendChild(header)

        let titleE = document.createElement("h1")
        titleE.innerHTML = this.title
        header.appendChild(titleE);
        this.titleE = titleE;
        //---

        //Body
        let body = document.createElement("div")
        body.classList.add("modal-body")
        const bodyElements = this.getBodyElements()
        bodyElements.forEach(element => {
            body.append(element)
        });
        modal.appendChild(body);
        //---

        //Footer
        let footer = document.createElement("div")
        footer.classList.add("modal-footer")
        const buttons = this.getFooterButtons()
        buttons.forEach(button => {
            footer.append(button)
        });
        modal.appendChild(footer);

        dimmer.classList.add("hidden")
        modal.classList.add("hidden")

        this.modal = modal
        this.dimmer = dimmer
        this.append(modal, dimmer)
    }

    disconnectedCallback() {
        document.removeEventListener("keyup", this.keyUp)
    }

    getBodyElements() {
        const defaultP = document.createElement("p")
        defaultP.innerHTML = this.message
        return [defaultP]
    }

    getFooterButtons() {
        return [Modal.getButton("OK", () => { this.close() })]
    }

    open() {
        this.parent.appendChild(this)
        void this.offsetWidth // Trigger Reflow
        this.modal.classList.remove("hidden")
        this.dimmer.classList.remove("hidden")
        KeybindManager.lock = true
        MS.modalsOpen += 1
    }

    close() {
        if (!this.modal) return
        this.dispatchEvent(new CustomEvent("close"))
        this.modal.classList.add("hidden")
        this.dimmer.classList.add("hidden")
        this.ontransitionend = () => this.remove();
        KeybindManager.lock = false
        MS.modalsOpen -= 1
        delete this
    }
}

class DefaultModal extends Modal {
    static linkedSoundboard(path) {
        return new Modal('Linked soundboard', 'This soundboard is linked to a <a href="' + path + '">folder</a>.<br/>' +
            'Add the sound to the folder and it will appear here automatically.')
    }
}

Modal.blockClosureKey = false

module.exports = Modal
module.exports.DefaultModal = DefaultModal
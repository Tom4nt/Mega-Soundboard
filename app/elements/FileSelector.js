const { ipcRenderer } = require('electron')
const path = require('path')

class FileSelector extends HTMLElement {
    constructor(hint, typeName, extensions) {
        super()
        this.hint = hint
        this.extensions = extensions
        this.typeName = typeName
    }

    connectedCallback() {
        this.input = document.createElement("input")
        this.input.type = "text"
        this.input.placeholder = this.hint
        if (this.value) this.input.value = this.value
        this.input.classList.add("fileselector-input")

        let button = document.createElement("button")
        button.classList.add("fileselector-button")
        button.onclick = () => this.browseFile()
        button.innerHTML = "..."

        this.append(this.input, button)
    }

    browseFile() {
        const location = ipcRenderer.sendSync("file.browse", this.typeName, this.extensions)
        if (location) {
            this.path = location
        }
    }

    get path() {
        return this.input.value
    }

    set path(value) {
        this.value = value
        if (this.input) this.input.value = value
        this.dispatchEvent(new CustomEvent(FileSelector.EVENT_VALUE_CHANGED, { detail: value }))
    }

    warn() {
        if (this.input.classList.contains("warn")) return
        this.input.classList.add("warn")
        setTimeout(() => {
            this.input.classList.remove("warn")
        }, 400)
    }

    getFileNameNoExtension() {
        if (this.path) {
            return path.basename(this.path, path.extname(this.path))
        } else {
            return null
        }
    }
}

FileSelector.EVENT_VALUE_CHANGED = "value-changed"

module.exports = FileSelector
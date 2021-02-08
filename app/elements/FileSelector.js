const { ipcRenderer } = require('electron')
const path = require('path')
const fs = require('fs')

class FileSelector extends HTMLElement {
    constructor(hint, type, typeName, extensions) {
        super()
        this.hint = hint
        this.type = type
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
        button.innerHTML = "folder"

        this.append(this.input, button)
    }

    browseFile() {
        if (this.type == FileSelector.FILE_TYPE) {
            ipcRenderer.invoke("file.browse", false, this.typeName, this.extensions).then((paths) => {
                if (paths) {
                    this.path = paths
                }
            })
        } else {
            ipcRenderer.invoke('folder.browse').then((path) => {
                if (path) this.path = path
            })
        }
    }

    get path() {
        if (!this.input) return this.value
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

    setLabel(label) {
        this.input.placeholder = label
    }

    /**
     * Verifies if the path is not empty, the file/folder exists, and if it is within the accepted extensions.
     */
    isPathValid() {
        if (!fs.existsSync(this.path)) return false

        let s = fs.statSync(this.path)
        if (this.type == FileSelector.FILE_TYPE) {
            if (s.isDirectory()) return false

            let ext = path.extname(this.path).substring(1)

            if (!this.extensions || this.extensions.includes(ext)) {
                return true
            } else return false

        } else {
            if (s.isFile()) return false
            return true
        }
    }
}

FileSelector.FOLDER_TYPE = 'folder'
FileSelector.FILE_TYPE = 'file'
FileSelector.EVENT_VALUE_CHANGED = "value-changed"

module.exports = FileSelector
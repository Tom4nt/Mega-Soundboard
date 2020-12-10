module.exports = class Checkbox extends HTMLElement {
    constructor(label) {
        super()
        this._toggled = false
        this._label = label
    }

    connectedCallback() {
        let div = document.createElement("div")
        div.classList.add("toggler-box")
        this.container = div

        let content = document.createElement("div")
        content.classList.add("toggler-pointer")
        this.pointer = content

        if (this.toggled) {
            this.pointer.classList.add("toggled")
            this.container.classList.add("toggled")
        }

        div.append(content)

        let label = document.createElement("span")
        label.innerHTML = this.getAttribute("text") ? this.getAttribute("text") : this._label
        label.classList.add("toggler-label")

        this.append(div, label)
        this.onclick = () => {
            this.toggle()
        }
    }

    toggle() {
        this.toggled = !this.toggled
        this.dispatchEvent(new CustomEvent("toggle"))
    }

    get toggled() {
        return this._toggled
    }

    set toggled(value) {
        this._toggled = value
        if (!this.pointer || !this.container) return;
        if (value) {
            this.pointer.classList.add("toggled")
            this.container.classList.add("toggled")
        } else {
            this.pointer.classList.remove("toggled")
            this.container.classList.remove("toggled")
        }
    }
}
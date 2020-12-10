module.exports = class IconButton extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        if (this.hasAttribute("red")) {
            this.classList.add("red")
        }
    }

    set red(value) {
        this._red = value
        if (value) {
            this.classList.add("red")
        } else {
            this.classList.remove("red")
        }
    }

    get red() {
        return this._red
    }
}
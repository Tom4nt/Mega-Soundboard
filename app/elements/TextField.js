module.exports = class TextField extends HTMLElement {
    constructor(hint) {
        super()
        this.hint = hint
    }

    connectedCallback() {
        let input = document.createElement("input")
        input.classList.add("textInput-default")
        input.placeholder = this.hint
        if (this.value) input.value = this.value
        input.type = "text"
        this.input = input

        this.append(input)
    }

    get text() {
        return this.input.value
    }

    set text(value) {
        this.value = value
        if (this.input) this.input.value = value
    }

    warn() {
        if (this.input.classList.contains("warn")) return
        this.input.classList.add("warn")
        setTimeout(() => {
            this.input.classList.remove("warn")
        }, 400)
    }
}
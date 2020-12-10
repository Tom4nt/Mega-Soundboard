module.exports = class Slider extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        if (this.connected) return
        this.connected = true

        if (this.getAttribute("label")) {
            let label = document.createElement("span")
            label.classList.add("slider-label")
            label.innerHTML = this.getAttribute("label")
            this.appendChild(label)
        }

        let label = document.createElement("div")
        label.classList.add("slider-label")
        label.innerHTML = 100
        this.label = label

        let input = document.createElement("input")
        input.classList.add("slider-input")
        input.min = 0
        input.max = 100
        input.type = "range"
        if (this._value >= 0) input.value = this._value
        else input.value = 100
        this.input = input

        input.oninput = () => {
            this.update()
        }
        this.update()
        this.addEventListener("mouseover", (e) => { label.style.left = `${this.getLabelPos()}px` })

        this.append(input, label)
    }

    update() {
        let progressColor = "var(--color-white)"
        let maincolor = "var(--color-dark)"

        this.input.style.background = `linear-gradient(to right, ${progressColor} 0%, ${progressColor} ${this.input.value}%, ${maincolor} ${this.input.value}%, ${maincolor} 100%)`
        this.label.innerHTML = `Volume ${this.input.value}%`;
        this.label.style.left = `${this.getLabelPos()}px`;
    }

    getLabelPos() {
        const label = this.label
        const input = this.input
        const half_label_width = label.clientWidth / 2
        const slider_width = input.clientWidth
        const center_position = slider_width / 2;
        const percent_of_range = input.value / (input.max - input.min);
        const value_px_position = percent_of_range * slider_width;
        const dist_from_center = value_px_position - center_position;
        const percent_dist_from_center = dist_from_center / center_position;
        const offset = percent_dist_from_center * 6;
        return value_px_position - half_label_width - offset + 1.5;
    }

    get value() {
        return Number(this.input.value)
    }

    set value(num) {
        this._value = num
        if (this.input) {
            this.input.value = num
            this.update()
        }
    }
}
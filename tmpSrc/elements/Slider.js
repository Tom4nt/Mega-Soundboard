const MS = require("../models/MS")

class Slider extends HTMLElement {
    constructor(labelText) {
        super()
        this.progressColor = "var(--color-white)"
        this.maincolor = "var(--color-darkL)"
        this.labelText = labelText
    }

    connectedCallback() {
        if (this.connected) return
        this.connected = true

        if (this.getAttribute("label")) {
            let label = document.createElement("span")
            label.classList.add("slider-label")
            if (!this.labelText) this.labelText = this.getAttribute("label")
            this.label = label
            this.appendChild(label)
        }

        let input = document.createElement("input")
        input.classList.add("slider-input")
        input.min = 0
        input.max = 100
        input.type = "range"
        if (this._value >= 0) input.value = this._value
        else input.value = 100
        this.input = input

        input.oninput = () => {
            this.updateSliderColor()
            this.updateLabel()
        }

        this.addEventListener('mouseenter', e => {
            this.popup = MS.openPopup('a', this.getBoundingClientRect(), 'top')
            this.updateLabel()
        })

        this.addEventListener('mouseleave', (e) => {
            MS.closePopup(this.popup)
        })

        this.append(input)
        if (this.label) this.append(this.label)
        this.updateSliderColor()
    }

    disconnectedCallback() {
        if (this.popup) MS.closePopup(this.popup)
    }

    updateSliderColor() {
        this.input.style.background =
            `linear-gradient(to right, ${this.progressColor} 0%, ${this.progressColor} ${this.input.value}%, ${this.maincolor} ${this.input.value}%, ${this.maincolor} 100%)`
    }

    updateLabel() {
        if (this.labelText) this.popup.innerHTML = this.labelText + ' | ' + this.getPercentage()
        else this.popup.innerHTML = this.getPercentage()
        this.popup.style.left = this.getThumbX() - this.popup.offsetWidth / 2 + 'px'
    }

    getThumbX() {
        const input = this.input
        const x = input.getBoundingClientRect().x
        const slider_width = input.clientWidth
        const center_position = slider_width / 2;
        const percent_of_range = input.value / (input.max - input.min);
        const value_px_position = percent_of_range * slider_width;
        const dist_from_center = value_px_position - center_position;
        const percent_dist_from_center = dist_from_center / center_position;
        const offset = percent_dist_from_center * 6;
        return value_px_position - offset + x;
    }

    getPercentage() {
        return this.input.value + '%'
    }

    get value() {
        return Number(this.input.value)
    }

    set value(num) {
        this._value = num
        if (this.input) {
            this.input.value = num
            this.updateSliderColor()
        }
    }
}

module.exports = Slider
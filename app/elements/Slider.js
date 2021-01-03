module.exports = class Slider extends HTMLElement {
    constructor() {
        super()
        this.progressColor = "var(--color-white)"
        this.maincolor = "var(--color-dark)"
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
            this.updateLabel(false, true)
        }

        this.addEventListener('mouseover', (e) => {
            if (e.target === this && !this.hover) {
                this.updateLabel()
                this.hover = true
            }
        })

        this.addEventListener('mouseleave', (e) => {
            if (e.target === this && this.hover) {
                this.updateLabel(true)
                this.hover = false
            }
        })

        this.append(input, label)
        this.updateSliderColor()
    }

    updateSliderColor() {
        this.input.style.background =
            `linear-gradient(to right, ${this.progressColor} 0%, ${this.progressColor} ${this.input.value}%, ${this.maincolor} ${this.input.value}%, ${this.maincolor} 100%)`
    }

    updateLabel(leave, parcial) {
        if (!leave && !parcial) {
            this.label.style.display = 'none'
            this.label.style.left = this.getLabelPos() + 'px';
            this.label.style.top = this.input.getBoundingClientRect().y - 40 + 'px'
            this.label.style.transform = 'scale(0.8)'
            this.label.style.opacity = 0
            this.label.style.display = 'unset'
        }

        if (!parcial) {
            this.label.style.top = this.input.getBoundingClientRect().y - (leave ? 40 : 46) + 'px' // Setting top triggers reflow so the transition plays.
            this.label.style.opacity = leave ? 0 : 1
            this.label.style.transform = leave ? 'scale(0.8)' : null
        }

        this.label.innerHTML = `Volume ${this.input.value}%`;
        this.label.style.left = this.getLabelPos() + 'px';

        this.updateSliderColor()
    }

    updateLabelX() {
        this.label.style.left = this.getLabelPos() + 'px';
    }

    getLabelPos() {
        const label = this.label
        const input = this.input
        const x = input.getBoundingClientRect().x
        const half_label_width = label.clientWidth / 2
        const slider_width = input.clientWidth
        const center_position = slider_width / 2;
        const percent_of_range = input.value / (input.max - input.min);
        const value_px_position = percent_of_range * slider_width;
        const dist_from_center = value_px_position - center_position;
        const percent_dist_from_center = dist_from_center / center_position;
        const offset = percent_dist_from_center * 6;
        return value_px_position - half_label_width - offset + x;
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
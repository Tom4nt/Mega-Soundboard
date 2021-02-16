const MS = require("../models/MS")

class InfoBalloon extends HTMLElement {
    constructor(text, position) {
        super()
        this._text = text
        this._position = position
    }

    connectedCallback() {
        this.innerHTML = 'i'

        this.addEventListener('mouseenter', () => {
            if (this.currentPopup) return
            let rect = this.getBoundingClientRect()
            this.currentPopup = MS.openPopup(this._text, rect, this._position)
        })

        this.addEventListener('mouseleave', () => {
            if (this.currentPopup) {
                MS.closePopup(this.currentPopup)
                this.currentPopup = null
            }
        })
    }

    disconnectedCallback() {
        MS.closePopup(this.currentPopup)
    }
}

module.exports = InfoBalloon
const MS = require("../models/MS")

class InfoBalloon extends HTMLElement {
    constructor(text) {
        super()
        this._text = text
    }

    connectedCallback() {
        this.innerHTML = 'i'

        this.addEventListener('mouseenter', () => {
            if (this.currentPopup) return
            let rect = this.getBoundingClientRect()
            this.currentPopup = MS.openPopup(this._text, rect.x + rect.width / 2, rect.y + rect.height / 2)
        })

        this.addEventListener('mouseleave', () => {
            if (this.currentPopup) {
                MS.closePopup(this.currentPopup)
                this.currentPopup = null
            }
        })
    }
}

module.exports = InfoBalloon
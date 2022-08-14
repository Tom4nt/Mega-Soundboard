const Modal = require("./Modal");
const MS = require('../../models/MS.js');
const fs = require('fs')

class NewsModal extends Modal {

    constructor() {
        super("What's New")
    }

    getBodyElements() {
        const newsFile = fs.readFileSync(__dirname + '/../../news.html', 'utf-8')

        let d = document.createElement('div')
        d.classList.add('news')
        d.innerHTML = newsFile

        return [d]
    }

    getFooterButtons() {
        const buttons = [
            Modal.getButton("Close", () => { this.close() }),
        ]

        return buttons
    }
}

module.exports = NewsModal
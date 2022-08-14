const Modal = require("./Modal");
const MS = require('../../models/MS.js');
const NewsModal = require('./NewsModal');
const { ipcRenderer } = require("electron");

class MSModal extends Modal {

    constructor() {
        super("Mega Soundboard")
    }

    getBodyElements() {

        const icon = document.createElement('img')
        icon.src = 'res/icon.ico'
        icon.style.display = 'block'
        icon.style.margin = 'auto'
        icon.style.marginBottom = '8px'
        icon.style.height = '64px'

        const ver = document.createElement('h4')
        ver.style.textAlign = 'center'
        ver.style.marginBottom = '22px'

        const buttons = document.createElement('div')
        buttons.style.textAlign = 'center'

        const btnGitHub = document.createElement('button')
        btnGitHub.innerHTML = '<span>GitHub</span><span class="icon">open_browser</span>'
        btnGitHub.style.marginRight = '8px'
        btnGitHub.onclick = () => ipcRenderer.invoke('open.url', 'https://github.com/Tom4nt/Mega-Soundboard')

        const btnReport = document.createElement('button')
        btnReport.innerHTML = '<span>Report a Bug</span><span class="icon">open_browser</span>'
        btnReport.style.marginRight = '8px'
        btnReport.onclick = () => ipcRenderer.invoke('open.url', 'https://github.com/Tom4nt/Mega-Soundboard/issues/new?assignees=&labels=&template=bug_report.md&title=')

        const btnChanges = document.createElement('button')
        btnChanges.innerHTML = '<span>Changelog</span>'
        btnChanges.onclick = () => {
            this.close()
            const newsModal = new NewsModal()
            newsModal.open()
        }

        buttons.append(btnGitHub, btnReport, btnChanges)

        MS.getVersion().then((version) => {
            ver.innerHTML = 'Version ' + version
        })

        return [icon, ver, buttons]
    }

    getFooterButtons() {
        const buttons = [
            Modal.getButton("Close", () => { this.close() }),
        ]

        return buttons
    }
}

module.exports = MSModal
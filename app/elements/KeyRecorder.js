const { ipcRenderer } = require('electron')
const Keys = require('../models/Keys.js');
const MS = require('../models/MS.js');

const NO_KEY_DESC = "No Keybind"

class KeyRecorder extends HTMLElement {
    constructor() {
        super()
        this._keys = null
        this.recording = false

        this.keyDown = (event, key) => {
            if (!this.recording) return
            if (!recKeys.includes(key)) {
                recKeys.push(key);
            }
            //console.log(this.keys)
            this.keys = recKeys.slice()
        }

        this.keyUp = (e, key) => {
            if (!this.recording) return
            recKeys.splice(recKeys.indexOf(key), 1)
                //console.log(this.keys)
        }

        this.contextmenu = () => { this.clear() }

        let recKeys = []
        ipcRenderer.on("key.down", this.keyDown)
        ipcRenderer.on("key.up", this.keyUp)

        this.addEventListener("contextmenu", this.contextmenu)
    }

    get keys() {
        return this._keys
    }

    set keys(keys) {
        this._keys = keys
        if (this.connected) this.setDisplayedKeys(Keys.toKeyStringArray(keys))
    }

    connectedCallback() {
        if (this.connected) return
        this.connected = true

        const label = document.createElement("span")
        label.classList.add("keyrecorder-label")
        label.innerHTML = NO_KEY_DESC
        this.label = label

        const indicator = document.createElement("span")
        indicator.classList.add("keyrecorder-indicator")
        indicator.innerHTML = "Record keybind"
        this.indicator = indicator

        this.append(label, indicator)

        window.addEventListener("click", (e) => {
            if (e.path.includes(this)) {
                if (this.recording)
                    this.stop()
                else
                    this.start()
            } else
                this.stop()
        })

        this.setDisplayedKeys(Keys.toKeyStringArray(this.keys))
    }

    disconnectedCallback() {
        ipcRenderer.removeListener("key.down", this.keyDown)
        ipcRenderer.removeListener("key.up", this.keyUp)
        this.removeEventListener("contextmenu", this.contextmenu)
    }

    start() {
        if (this.recording) return
        this.recording = true
        this.classList.add("recording")
        this.label.innerHTML = "Recording..."
        this.indicator.innerHTML = "Stop recording"
        MS.recordingKey = true

        const startEvent = new CustomEvent(KeyRecorder.EVENT_START_RECORDING)
        this.dispatchEvent(startEvent)

        ipcRenderer.send("key.startRecording")
    }

    stop() {
        if (!this.recording) return
        this.recording = false
        this.classList.remove("recording")
        this.label.innerHTML = NO_KEY_DESC
        this.indicator.innerHTML = "Record keybind"
        MS.recordingKey = false

        const stopEvent = new CustomEvent(KeyRecorder.EVENT_STOP_RECORDING)
        this.dispatchEvent(stopEvent)

        ipcRenderer.send("key.stopRecording")
    }

    setDisplayedKeys(keys) {
        if (!keys || keys.length < 1) return

        const keyElements = this.querySelectorAll(".key")
        if (keyElements)
            keyElements.forEach(e => e.remove())
        this.label.style.display = "none"

        keys.forEach(key => {
            const keyE = document.createElement("span")
            keyE.innerHTML = key
            keyE.classList.add("key")
            this.append(keyE)
        });
    }

    clear() {
        this.label.style.display = "unset"
        this.keys = null
        this.dispatchEvent(new CustomEvent(KeyRecorder.EVENT_CLEAR))
        const keyElements = this.querySelectorAll(".key")
        if (keyElements)
            keyElements.forEach(e => e.remove())
    }
}

// Event Names
KeyRecorder.EVENT_START_RECORDING = 'start-recording'
KeyRecorder.EVENT_STOP_RECORDING = 'stop-recording'
KeyRecorder.EVENT_CLEAR = 'clear'

module.exports = KeyRecorder
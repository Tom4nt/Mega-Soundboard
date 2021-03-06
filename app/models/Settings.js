const { ipcRenderer } = require('electron');
const fs = require("fs")

const savePath = ipcRenderer.sendSync('get.savePath')
const dataPath = savePath + "\\Settings.json"

module.exports = class Settings {
    constructor() {
        this.minToTray = true
        this.stopSoundsKeys = null
        this.enableKeybinds = true
        this.enableKeybindsKeys = null
        this.overlapSounds = true
        this.mainDevice = "default"
        this.secondaryDevice = null
        this.mainDeviceVolume = 100
        this.secondaryDeviceVolume = 100
        this.selectedSoundboard = 0
        this.latestLogViewed = 0
        this.soundsLocation = null
    }

    getSoundsLocation() {
        if (this.soundsLocation) return this.soundsLocation
        else return savePath + '\\Sounds'
    }

    static load() {
        let settings = new Settings()
        if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath);
        }

        if (fs.existsSync(dataPath)) {
            let dataJSON = fs.readFileSync(dataPath);
            try {
                const jsonData = JSON.parse(dataJSON);
                Object.assign(settings, jsonData)
                ipcRenderer.send('win.minToTray', settings.minToTray)
            } catch (err) {
                dialog.showErrorBox("Error loading settings file", "There is a syntax error in the settings file located at " + dataPath + "\n\n" + err.message +
                    "\n\nIf you modified this file, please fix any syntax errors.");
                app.quit();
                return;
            }
        }

        return settings
    }

    save() {
        let json = JSON.stringify(this, null, 2);
        fs.writeFileSync(dataPath, json);
    }
}
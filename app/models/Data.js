const { app, dialog } = require("electron").remote
const fs = require("fs")
const savePath = app.getPath("appData") + "\\MegaSoundboard"
const dataPath = savePath + "\\Soundboards.json"
const Soundboard = require('./Soundboard.js');

module.exports = class Data {
    constructor() {
        this.soundboards = []
    }

    // selectSoundboard(soundboard) {
    //     for (let i = 0; i < this.soundboards.length; i++) {
    //         const sb = this.soundboards[i];
    //         if (sb == soundboard) {
    //             this.selectedSoundboardID = i
    //         }
    //     }
    // }

    addSoundboard(soundboard) {
        this.soundboards.push(soundboard)
    }

    removeSoundboard(soundboard) {
        this.soundboards.splice(this.soundboards.indexOf(soundboard), 1)
    }

    // /**
    //  * @returns {Soundboard}
    //  */
    // getSelectedSoundboard() {
    //     return this.soundboards[this.selectedSoundboardID]
    // }

    static load() {
        let data = new Data()
        if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath);
        }

        if (!fs.existsSync(dataPath)) {
            let sb = new Soundboard("Default")
            data.addSoundboard(sb)
        } else {
            let dataJSON = fs.readFileSync(dataPath);
            try {
                let jsonData = JSON.parse(dataJSON);
                data.soundboards = this.getSoundboardsFromData(jsonData.soundboards)
            } catch (err) {
                dialog.showErrorBox("Error loading save file", "There is a syntax error in the save file located at " + dataPath + "\n\n" + err.message +
                    "\n\nIf you modified this file, please fix any syntax errors.");
                app.quit();
                return;
            }
        }
        return data
    }

    static getSoundboardsFromData(data) {
        const sbs = []
        if (!data) return sbs
        data.forEach(sb => {
            sbs.push(Soundboard.fromSoundboardData(sb))
        });
        return sbs
    }

    save() {
        let data = JSON.stringify(this, null, 2);
        fs.writeFileSync(dataPath, data);
    }
}
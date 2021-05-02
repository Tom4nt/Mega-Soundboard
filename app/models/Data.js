const { ipcRenderer } = require("electron")
const fs = require("fs")
const Soundboard = require('./Soundboard.js');

const savePath = ipcRenderer.sendSync('get.savePath')
const dataPath = savePath + "\\Soundboards.json"

class Data {
    constructor() {
        this.soundboards = []
    }

    addSoundboard(soundboard) {
        this.soundboards.push(soundboard)
    }

    removeSoundboard(soundboard) {
        soundboard.removeFolderListener()
        this.soundboards.splice(this.soundboards.indexOf(soundboard), 1)
    }

    static load() {

        let data = new Data()
        if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath);
        }

        if (!fs.existsSync(dataPath)) {
            let sb = new Soundboard("Default", null, 100, null)
            data.addSoundboard(sb)
        } else {
            let dataJSON = fs.readFileSync(dataPath);
            try {
                let jsonData = JSON.parse(dataJSON);
                data.soundboards = this.getSoundboardsFromData(jsonData.soundboards)
            } catch (err) {
                console.error(err)
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
        console.log('Saved.')
    }
}

module.exports = Data
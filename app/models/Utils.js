const fs = require('fs')
const p = require('path')

class Utils {

    static isValidSoundFile(path) {
        const ext = p.extname(path)
        if (ext == '.mp3' || ext == '.wav' || ext == '.ogg') {
            return true
        }
        else return false
    }

    /**
     * @returns {Number}
     */
    static getElementIndex(element) {
        let i = 0;
        while ((element = element.previousElementSibling) != null) ++i;
        return i;
    }

    static getNameFromFile(path) {
        return p.basename(path, p.extname(path))
    }

}

module.exports = Utils
const Sound = require('./Sound.js');

class Soundboard {
    constructor(name, keys, volume) {
        this.name = name
        this.sounds = []
        this.keys = keys
        if (volume < 1) volume = 100
        this.volume = volume
    }

    static fromSoundboardData(data) {
        const sb = new Soundboard()

        if (data.name) sb.name = data.name
        else sb.name = "¯\\_(ツ)_/¯"

        if (data.keys) sb.keys = data.keys

        if (data.volume) sb.volume = data.volume

        if (data.sounds) sb.sounds = this.getSoundsFromData(data.sounds, sb)

        return sb
    }

    static getSoundsFromData(data, soundboard) {
        const sounds = []
        data.forEach(sound => {
            const s = Sound.fromData(sound, soundboard)
            sounds.push(s)
        });
        return sounds
    }

    addSound(sound) {
        this.sounds.push(sound)
    }

    removeSound(sound) {
        this.sounds.splice(this.sounds.indexOf(sound), 1)
    }
}

module.exports = Soundboard
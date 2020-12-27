const fs = require("fs")

module.exports = class Sound {
    constructor(name, path, volume, keys, soundboard) {
        this.name = name
        this.path = path
        this.volume = volume
        this.keys = keys

        this.soundboard = soundboard // Reference to the soundboard where this sound is
        this.instances = []
        this.playing = false
    }

    toJSON() {
        return {
            name: this.name,
            path: this.path,
            volume: this.volume,
            keys: this.keys
        }
    }

    static fromData(data, soundboard) {
        const sound = new Sound()

        if (data.name) sound.name = data.name
        else sound.name = "¯\\_(ツ)_/¯"

        if (data.path) sound.path = data.path
        else {
            if (data.url) sound.path = data.url // Old save format
        }

        if (data.volume) sound.volume = data.volume
        else sound.volume = 100 // Default

        if (data.keys) sound.keys = data.keys
        else {
            if (data.shortcut) sound.keys = data.shortcut // Old save format
        }

        if (soundboard) sound.soundboard = soundboard

        return sound
    }

    play(onend, volume1, volume2, device1, device2) {
        let url = this.path;
        if (!fs.existsSync(url)) {
            return false
        }
        let sound = new Audio(url);
        let sound2 = new Audio(url);
        this.instances.push(sound, sound2);
        this.playing = true

        console.log("Added and playing 2 instances of " + this.name + ".")

        sound.addEventListener('ended', (e) => {
            this.instances.splice(this.instances.indexOf(sound), 1);
            if (this.instances.length < 1) {
                this.playing = false
                console.log("All instances of " + this.name + " finished playing.")
                onend()
            }
        });
        sound2.addEventListener('ended', (e) => {
            this.instances.splice(this.instances.indexOf(sound2), 1);
            if (this.instances.length < 1) {
                this.playing = false
                console.log("All instances of " + this.name + " finished playing.")
                onend()
            }
        });

        let soundboardVolume = 100
        if (this.soundboard) soundboardVolume = this.soundboard.volume
        else console.warn(this.name + " has no soundboard attached. Playing at 100% soundboard volume.")

        sound.volume = Math.pow((volume1 / 100) * (this.volume / 100) * (soundboardVolume / 100), 2);
        sound2.volume = Math.pow((volume2 / 100) * (this.volume / 100) * (soundboardVolume / 100), 2);
        sound.setSinkId(device1 ? device1 : "default");
        sound2.setSinkId(device2 ? device2 : "default");
        sound.play();
        if (device2) {
            sound2.play();
        } else {
            this.instances.splice(this.instances.indexOf(sound2), 1);
        }
        return true;
    }

    stop() {
        for (let i = 0; i < this.instances.length; i++) {
            const sound = this.instances[i];
            sound.pause()
            this.instances.splice(i, 1)
            i--
        }
        this.playing = false
        console.log("Stopped all instances of " + this.name + ".")
    }

    isPlaying() {
        return this.playing
    }
}
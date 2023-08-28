import { Sound, Soundboard } from "../../shared/models";
import Utils from "./utils";
import { promises as fs } from "fs";
import path = require("path");
import SoundUtils from "./soundUtils";
import { randomUUID } from "crypto";

export default class SoundboardUtils {

    /** Adds Sounds to and/or removes them from the specified Soundboard as necessary
     * to sync them with its linked folder. */
    static async syncSounds(soundboard: Soundboard): Promise<void> {
        if (!soundboard.linkedFolder) return;
        await Utils.verifyAccessibleDirectory(soundboard.linkedFolder);

        const files = await fs.readdir(soundboard.linkedFolder);

        // Loop through files and add unexisting sounds
        for (let i = 0; i < files.length; i++) {
            const file = files[i]!;
            const soundPath = path.join(soundboard.linkedFolder, file);
            if (SoundUtils.isValidSoundFile(soundPath)) {
                const soundWithPath = Soundboard.getSoundWithPath(soundboard, soundPath);
                const stat = await fs.stat(soundPath);
                if (!soundWithPath && stat.isFile()) {
                    const s = new Sound(randomUUID(), Utils.getNameFromFile(soundPath), soundPath, 100, []);
                    s.soundboardUuid = soundboard.uuid;
                    soundboard.sounds.push(s);
                }
            }
        }

        // Loop through existing sounds and remove those without a file
        if (soundboard.sounds.length > 0) {
            for (let i = soundboard.sounds.length - 1; i >= 0; i--) {
                const sound = soundboard.sounds[i]!;
                const contains = Utils.folderContains(soundboard.linkedFolder, files, sound.path);
                if (!contains) soundboard.sounds.splice(i, 1);
            }
        }
    }
}

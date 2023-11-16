import Utils from "./utils";
import { promises as fs } from "fs";
import path = require("path");
import SoundUtils from "./soundUtils";
import { randomUUID } from "crypto";
import { Soundboard } from "../../shared/models/soundboard";
import { Sound } from "../../shared/models/sound";
import { getSoundWithPath, removeSubSounds } from "../../shared/models/container";

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
            if (!SoundUtils.isValidSoundFile(soundPath)) return;
            const soundWithPath = getSoundWithPath(soundboard.playables, soundPath);
            const stat = await fs.stat(soundPath);
            if (!soundWithPath && stat.isFile()) {
                const s: Sound = {
                    uuid: randomUUID(),
                    name: Utils.getNameFromFile(soundPath),
                    path: soundPath,
                    volume: 100,
                    keys: [],
                    parentUuid: soundboard.uuid,
                };
                soundboard.playables.push(s);
            }
        }

        // Loop through existing sounds and remove those without a file
        if (soundboard.playables.length > 0) {
            removeSubSounds(soundboard.playables, soundboard.linkedFolder, files);
        }
    }
}

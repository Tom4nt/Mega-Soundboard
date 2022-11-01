import * as p from "path";
import { randomUUID } from "crypto";
import { Sound } from "../../shared/models";
import Utils from "./utils";
import SharedUtils from "../../shared/sharedUtils";

export default class SoundUtils {

    static getNewSoundsFromPaths(paths: string[]): Sound[] {
        return Array.from(this.iterateSoundsFromPaths(paths));
    }

    static *iterateSoundsFromPaths(paths: string[]): Generator<Sound> {
        for (const path of paths) {
            yield new Sound(
                randomUUID(),
                Utils.getNameFromFile(path),
                path, 100, [],
            );
        }
    }

    static isValidSoundFile(path: string): boolean {
        const ext = p.extname(path);
        return SharedUtils.validSoundExts.includes(`.${ext}`);
    }

    static getValidSoundPaths(paths: string[]): string[] {
        return paths.filter(x => this.isValidSoundFile(x));
    }
}

import * as p from "path";
import { promises as fs, constants as fsConstants, PathLike } from "fs";

export default class Utils {

    static isValidSoundFile(path: string): boolean {
        const ext = p.extname(path);
        if (ext == ".mp3" || ext == ".wav" || ext == ".ogg") {
            return true;
        }
        else return false;
    }

    static getElementIndex(element: Element): number {
        let i = 0;
        while (element.previousElementSibling != null) {
            element = element.previousElementSibling;
            ++i;
        }
        return i;
    }

    static getNameFromFile(path: string): string {
        return p.basename(path, p.extname(path));
    }

    static tryGetValue(data: Map<string, unknown>, keysToTry: string[], checkType: (v: unknown) => boolean): unknown {
        let res: unknown = null;
        keysToTry.every(key => {
            if (checkType(data.get(key))) res = data.get(key);
            else return true;
            return false;
        });
        return res;
    }

    static getFileNameNoExtension(path: string): string {
        return p.basename(path, p.extname(path));
    }

    /** Checks if a value is valid for keys */
    static isKeys(value: unknown): boolean {
        if (!Array.isArray(value)) return false;
        const array: Array<unknown> = value;
        return array.every(i => typeof i === "number");
    }

    static async pathExists(path: PathLike): Promise<boolean> {
        try {
            await fs.access(path, fsConstants.F_OK);
            return true;
        } catch (error) {
            return false;
        }
    }

    static objectToMap(object: object): Map<string, unknown> {
        const entries = Object.entries(object);
        return new Map<string, unknown>(entries);
    }
}
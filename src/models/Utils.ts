import * as p from "path";

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

    /** Checks if a value is valid for keys */
    static isKeys(value: unknown): boolean {
        if (!Array.isArray(value)) return false;
        const array: Array<unknown> = value;
        return array.every(i => typeof i === "string");
    }

}
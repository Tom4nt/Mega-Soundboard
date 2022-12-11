import * as p from "path";
import { promises as fs, constants as fsConstants, PathLike } from "fs";

export default class Utils {

    static resourcesPath = p.join(__dirname, "../../res");

    static *map<T, R>(source: Iterable<T>, callback: (element: T) => R): Iterable<R> {
        for (const item of source) {
            yield callback(item);
        }
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

    static async isPathOK(path: PathLike): Promise<boolean> {
        try {
            await fs.access(path, fsConstants.F_OK);
            return true;
        } catch (error) {
            return false;
        }
    }

    static parsePath(path: string): string | null {
        const res = p.parse(path);
        const parsed = p.join(res.dir, res.base);
        return res.dir === "" ? null : parsed;
    }

    static objectToMap(object: object): Map<string, unknown> {
        const entries = Object.entries(object);
        return new Map<string, unknown>(entries);
    }
}

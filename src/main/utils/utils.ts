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

    static getFileNameNoExtension(path: string): string {
        return p.basename(path, p.extname(path));
    }

    static async isPathAccessible(path: PathLike): Promise<boolean> {
        try {
            await fs.access(path, fsConstants.F_OK);
            return true;
        } catch (error) {
            return false;
        }
    }

    /** Throws an Error if the path is not a directory or if it's not accessible. */
    static async verifyAccessibleDirectory(path: string): Promise<void> {
        if (!await Utils.isPathAccessible(path))
            throw Error("The specified path cannot be accessed.");
        if (!(await fs.stat(path)).isDirectory())
            throw Error("The specified path is not valid because it is not a directory.");
    }

    static parsePath(path: string): string | null {
        const res = p.parse(path);
        const parsed = p.join(res.dir, res.base);
        return res.dir === "" ? null : parsed;
    }

    static folderContains(basePath: string, files: string[], fileToCompare: string): boolean {
        let contains = false;
        for (const file of files) {
            const path = p.join(basePath, file);
            if (p.resolve(fileToCompare) == p.resolve(path)) contains = true;
        }
        return contains;
    }

    static wait(seconds: number): Promise<void> {
        return new Promise<void>(p => setTimeout(() => p(), seconds * 1000));
    }

    static isPointInsideRect(point: [number, number], rect: Electron.Rectangle): boolean {
        return point[0] >= rect.x && point[0] <= rect.x + rect.width &&
            point[1] >= rect.y && point[1] <= rect.y + rect.height;
    }
}

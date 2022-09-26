import * as p from "path";
import { promises as fs, constants as fsConstants, PathLike } from "fs";

export default class Utils {

    static validSoundExts = ["mp3", "wav", "ogg"];

    static isValidSoundFile(path: string): boolean {
        const ext = p.extname(path);
        return this.validSoundExts.includes(`.${ext}`);
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

    /** Verifies if the path is not empty, the file/folder exists, and if it is within the accepted extensions. */
    static async isPathValid(path: PathLike, type: "file" | "folder", validExtensions: string[]): Promise<boolean> {
        if (! await this.isPathOK(path)) return false;

        const s = await fs.stat(path);
        if (type == "file") {
            if (s.isDirectory()) return false;

            const ext = p.extname(path.toString()).substring(1);
            return validExtensions.includes(ext) || validExtensions.length == 0;

        } else {
            return s.isDirectory();
        }
    }

    static objectToMap(object: object): Map<string, unknown> {
        const entries = Object.entries(object);
        return new Map<string, unknown>(entries);
    }

    static async getMediaDevices(): Promise<MediaDeviceInfo[]> {
        let devices = await navigator.mediaDevices.enumerateDevices();
        devices = devices.filter(device =>
            device.kind == "audiooutput" &&
            device.deviceId != "communications"
        );
        return devices;
    }
}
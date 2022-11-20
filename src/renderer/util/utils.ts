export default class Utils {
    static *map<T, R>(source: Iterable<T>, callback: (element: T) => R): Iterable<R> {
        for (const item of source) {
            yield callback(item);
        }
    }

    static getElementIndex(element: Element): number {
        let i = 0;
        while (element.previousElementSibling != null) {
            element = element.previousElementSibling;
            ++i;
        }
        return i;
    }

    static getDataTransferFilePaths(dataTransfer: DataTransfer): string[] {
        return Array.from(this.map(dataTransfer.files, x => x.path));
    }

    static getErrorMessage(error: unknown): string {
        if (error instanceof Error) return error.message;
        else return String(error);
    }

    static waitForDocument(): Promise<void> {
        if (document.readyState == "complete") {
            return Promise.resolve();
        }
        else {
            return new Promise<void>((complete) => {
                window.addEventListener("load", () => {
                    complete();
                });
            });
        }
    }

    static async getMediaDevices(): Promise<MediaDeviceInfo[]> {
        let devices = await navigator.mediaDevices.enumerateDevices();
        devices = devices.filter(device =>
            device.kind == "audiooutput" &&
            device.deviceId != "communications"
        );
        return devices;
    }

    static getStyle(name: string): HTMLStyleElement {
        const elem = document.createElement("link");
        elem.rel = "stylesheet";
        elem.href = `./css/${name}.css`;
        return elem;
    }
}

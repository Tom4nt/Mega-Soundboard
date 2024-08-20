export default class Utils {
	static *map<T, R>(source: Iterable<T>, callback: (element: T) => R): Iterable<R> {
		for (const item of source) {
			yield callback(item);
		}
	}

	static getElementIndex(element: Element, filter?: (element: Element) => boolean): number {
		let i = 0;
		while (element.previousElementSibling != null) {
			element = element.previousElementSibling;
			if (filter && !filter(element)) continue;
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

	static getTimeString(seconds: number): string {
		const ms = seconds * 1000;
		const iso = new Date(ms).toISOString();
		if (seconds < 3600) return iso.slice(14, 19);
		else return iso.slice(11, 19);
	}

	static async getValidSoundPaths(e: DragEvent): Promise<string[] | null> {
		if (!e.dataTransfer || e.dataTransfer.items.length < 1) return null;

		const paths = Utils.getDataTransferFilePaths(e.dataTransfer);
		const validPaths = await window.actions.getValidSoundPaths(paths);

		if (validPaths.length <= 0) return null;
		return validPaths;
	}
}

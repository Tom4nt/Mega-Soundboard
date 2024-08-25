import { promises as fs } from "fs";
import * as p from "path";
import Utils from "./utils/utils";
import { Event, ExposedEvent } from "../shared/events";
import { Sound } from "./data/models/sound";

export default class FolderWatcher {
	private watcher: AsyncIterable<fs.FileChangeInfo<string>>;
	private folder: string;
	private abortFlag = false;

	get onSoundAdded(): ExposedEvent<string> { return this._onSoundAdded.expose(); }
	private readonly _onSoundAdded = new Event<string>();

	get onSoundRemoved(): ExposedEvent<string> { return this._onSoundRemoved.expose(); }
	private readonly _onSoundRemoved = new Event<string>();

	constructor(folderPath: string) {
		this.folder = folderPath;
		this.watcher = fs.watch(folderPath);
	}

	async start(): Promise<boolean> {
		if (!await Utils.isDirectoryAccessible(this.folder)) {
			console.error("Tried to start folder watcher on inaccessible folder.");
			return false;
		}
		void this.listen();
		return true;
	}

	private async listen(): Promise<void> {
		for await (const info of this.watcher) {
			if (this.abortFlag) return;
			void this.handleChange(info);
		}
	}

	stop(): void {
		this.abortFlag = true;
	}

	private async handleChange(info: fs.FileChangeInfo<string>): Promise<void> {
		if (info.eventType != "rename" || !info.filename) return;
		const path = p.join(this.folder, info.filename);
		const exists = await Utils.isPathAccessible(path);

		if (exists) {
			const stat = await fs.stat(path);
			if (!stat.isFile() || !Sound.isValidSoundFile(path)) return;
			console.log(`Added ${path}`);
			this._onSoundAdded.raise(path);
		}

		else {
			if (!Sound.isValidSoundFile(path)) return;
			console.log(`Removed ${path}`);
			this._onSoundRemoved.raise(path);
		}
	}
}

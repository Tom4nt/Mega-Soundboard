import DataAccess from "./data/dataAccess";
import EventSender from "./eventSender";
import SettingsCache from "./data/settingsCache";
import SoundboardsCache from "./data/soundboardsCache";
import TrayManager from "./managers/trayManager";
import WindowManager from "./managers/windowManager";
import FolderWatcher from "./folderWatcher";
import KeybindManager from "./managers/keybindManager";
import { app } from "electron";
import * as path from "path";
import { Soundboard } from "./data/models/soundboard";
import { Sound } from "./data/models/sound";
import AudioManager from "./managers/audioManager";
import { isIDirectPlayable } from "./data/models/interfaces";
import KeybindHandler from "./keybindHandler";

/** Represents the app instance in the main process. */
export default class MS {
	private currentSoundboardWatcher: FolderWatcher | null = null;

	static readonly defaultSoundsPath = path.join(app.getPath("appData"), "MegaSoundboard/Sounds");
	static readonly latestWithLog = 5; // Increments on every version that should display the changelog.

	private static _instance?: MS;
	public static get instance(): MS {
		if (!MS._instance) throw Error("MS Singleton was not initialized");
		return MS._instance;
	}
	private static set instance(value: MS) {
		MS._instance = value;
	}

	public readonly keybindHandler: KeybindHandler;

	constructor(
		public readonly windowManager: WindowManager,
		public readonly trayManager: TrayManager,
		public readonly soundboardsCache: SoundboardsCache,
		public readonly settingsCache: SettingsCache,
		public readonly keybindManager: KeybindManager,
		public readonly audioManager: AudioManager,
	) {
		MS.instance = this;
		this.keybindHandler = new KeybindHandler(keybindManager, soundboardsCache, settingsCache, audioManager);
	}

	flagChangelogViewed(): void {
		this.settingsCache.settings.latestLogViewed = MS.latestWithLog;
		void DataAccess.saveSettings(this.settingsCache.settings);
	}

	getCurrentSoundboard(): Soundboard | undefined {
		const index = this.settingsCache.settings.selectedSoundboard;
		return this.soundboardsCache.soundboards[index];
	}

	async setCurrentSoundboard(soundboard: Soundboard): Promise<void> {
		const index = this.soundboardsCache.findSoundboardIndex(soundboard.uuid);
		this.settingsCache.settings.selectedSoundboard = index;

		if (this.currentSoundboardWatcher) this.currentSoundboardWatcher.stop();
		this.currentSoundboardWatcher = null;

		if (!soundboard.linkedFolder) {
			EventSender.send("currentSoundboardChanged", soundboard.asData());
			return;
		}

		const watcher = new FolderWatcher(soundboard.linkedFolder);
		this.currentSoundboardWatcher = watcher;

		watcher.onSoundAdded.addHandler(p => {
			const sound = Sound.getNewSoundsFromPaths([p])[0];
			if (sound)
				void MS.instance.soundboardsCache.addSounds([sound.asData()], soundboard.uuid, false);
		});

		watcher.onSoundRemoved.addHandler(path => {
			const sounds = soundboard.findChildrenRecursive(p => isIDirectPlayable(p) && p.getAudioPath() == path);
			if (sounds.length > 0) {
				void MS.instance.soundboardsCache.removePlayable(sounds[0]!.getUuid());
			}
		});

		await soundboard.syncSounds();
		await watcher.start();
		EventSender.send("currentSoundboardChanged", soundboard.asData());
	}
}

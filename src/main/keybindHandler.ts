import Keys from "../shared/keys";
import { isAction } from "../shared/quickActions";
import SettingsCache from "./data/settingsCache";
import SoundboardsCache from "./data/soundboardsCache";
import AudioManager from "./managers/audioManager";
import KeybindManager from "./managers/keybindManager";
import MS from "./ms";
import { actionBindings } from "./quickActionBindings";

export default class KeybindHandler {

	constructor(
		keybindManager: KeybindManager,
		private readonly soundboardsCache: SoundboardsCache,
		private readonly settingsCache: SettingsCache,
		private readonly audioManager: AudioManager,
	) {
		keybindManager.onKeybindPressed.addHandler(this.handleKeybindPressed);
	}

	private handleKeybindPressed = async (kb: number[]): Promise<void> => {
		await this.processActions(kb);
		await this.processSoundboards(kb);
		this.processSounds(kb);
	};

	private async processActions(kb: number[]): Promise<void> {
		const s = this.settingsCache.settings;
		if (this.areKeybindsEnabled()) {
			for (const k of s.quickActionKeys.keys()) {
				if (k === "toggleKeybinds") continue; // Special case below.
				const keybind = s.quickActionKeys.get(k);
				if (keybind && Keys.equals(kb, keybind) && isAction(k)) {
					await actionBindings[k](k as never, true);
				}
			}
		}

		// Special case. This action is toggled even when keybinds are disabled.
		const keys = s.quickActionKeys.get("toggleKeybinds");
		if (keys && Keys.equals(kb, keys)) {
			await actionBindings["toggleKeybinds"]("toggleKeybinds", true);
		}
	}

	private async processSoundboards(kb: number[]): Promise<void> {
		if (!this.areKeybindsEnabled()) return;

		const sounboard = this.soundboardsCache.soundboards.find(sb => Keys.equals(kb, sb.keys));
		if (sounboard) await MS.instance.setCurrentSoundboard(sounboard);
	}

	private processSounds(kb: number[]): void {
		if (!this.areKeybindsEnabled()) return;

		const currentSB = MS.instance.getCurrentSoundboard();
		if (!currentSB) return;

		const children = currentSB.findChildrenRecursive(p => Keys.equals(kb, p.getKeys()));
		for (const child of children) {
			this.audioManager.play(child.getUuid(), true);
		}
	}

	private areKeybindsEnabled(): boolean {
		return this.settingsCache.settings.quickActionStates.get("toggleKeybinds")!;
	}

}

import { ActionName } from "../shared/quickActions";
import EventSender from "./eventSender";
import MS from "./ms";

type QuickActionBindings = {
	[T in ActionName]: (key: T, softError: boolean) => Promise<void>
}

export const actionBindings: QuickActionBindings = {
	async stopSounds() {
		MS.instance.audioManager.stopAll();
	},

	async playRandomSound(_key, softError) {
		const ms = MS.instance;
		const sb = ms.soundboardsCache.soundboards[ms.settingsCache.settings.selectedSoundboard];
		if (!sb) throw new Error("Could not find the current soundboard.");
		const items = sb.getChildren();
		if (items.length <= 0) return;
		const index = Math.floor(Math.random() * items.length);
		ms.audioManager.play(items[index]!.getUuid(), softError);
	},

	async toggleKeybinds(key) {
		const ms = MS.instance;
		const s = ms.settingsCache.settings;
		s.quickActionStates.set(key, !s.quickActionStates.get(key)!);
		ms.trayManager.update(s.quickActionStates);
		EventSender.send("keybindsStateChanged", s.quickActionStates.get(key));
		await ms.settingsCache.save({ quickActionStates: s.quickActionStates });
	},

	async toggleSoundOverlap(key) {
		const ms = MS.instance;
		const s = ms.settingsCache.settings;
		s.quickActionStates.set(key, !s.quickActionStates.get(key)!);
		ms.trayManager.update(s.quickActionStates);
		EventSender.send("overlapSoundsStateChanged", s.quickActionStates.get(key));
		await ms.settingsCache.save({ quickActionStates: s.quickActionStates });
	},

	async toggleSoundLooping(key) {
		const ms = MS.instance;
		const s = ms.settingsCache.settings;
		s.quickActionStates.set(key, !s.quickActionStates.get(key)!);
		ms.trayManager.update(s.quickActionStates);
		EventSender.send("loopSoundsChanged", s.quickActionStates.get(key));
		await ms.settingsCache.save({ quickActionStates: s.quickActionStates });
	},
};

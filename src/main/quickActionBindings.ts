import { Settings } from "../shared/models";
import { ActionName } from "../shared/quickActions";
import EventSender from "./eventSender";
import MS from "./ms";

type QuickActionBindings = {
	[T in ActionName]: (key: T) => Promise<void>
}

export const actionBindings: QuickActionBindings = {
	async stopSounds() {
		EventSender.send("stopAll");
	},

	async playRandomSound() {
		const ms = MS.instance;
		const sb = ms.soundboardsCache.soundboards[ms.settingsCache.settings.selectedSoundboard];
		if (!sb) throw new Error("Could not find the current soundboard.");
		const items = sb.getPlayables();
		if (items.length <= 0) return;
		const index = Math.floor(Math.random() * items.length);
		const playData = ms.soundboardsCache.getPlayData(items[index]!.uuid);
		EventSender.send("playRequested", playData);
	},

	async toggleKeybinds(key) {
		const ms = MS.instance;
		const s = ms.settingsCache.settings;
		s.quickActionStates[key] = !Settings.getActionState(s, key);
		ms.trayManager.update(s.quickActionStates);
		ms.keybindManager.raiseExternal = s.quickActionStates[key]!;
		EventSender.send("keybindsStateChanged", s.quickActionStates[key]);
		await ms.settingsCache.save({ quickActionStates: s.quickActionStates });
	},

	async toggleSoundOverlap(key) {
		const ms = MS.instance;
		const s = ms.settingsCache.settings;
		s.quickActionStates[key] = !Settings.getActionState(s, key);
		ms.trayManager.update(s.quickActionStates);
		EventSender.send("overlapSoundsStateChanged", s.quickActionStates[key]);
		await ms.settingsCache.save({ quickActionStates: s.quickActionStates });
	},

	async toggleSoundLooping(key) {
		const ms = MS.instance;
		const s = ms.settingsCache.settings;
		s.quickActionStates[key] = !Settings.getActionState(s, key);
		ms.trayManager.update(s.quickActionStates);
		EventSender.send("loopSoundsChanged", s.quickActionStates[key]);
		await ms.settingsCache.save({ quickActionStates: s.quickActionStates });
	},
};

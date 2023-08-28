import { Settings } from "../shared/models";
import { ActionName } from "../shared/quickActions";
import EventSender from "./eventSender";
import MS from "./ms";

type QuickActionBindings = {
    [T in ActionName]: (key: T) => Promise<void>
}

export const actionBindings: QuickActionBindings = {
    async stopSounds() {
        EventSender.send("onStopAllSounds");
    },

    async playRandomSound() {
        const ms = MS.instance;
        const sb = ms.soundboardsCache.soundboards[ms.settingsCache.settings.selectedSoundboard];
        if (!sb) throw new Error("Could not find the current soundboard.");
        const items = sb.sounds;
        if (items.length <= 0) return;
        const index = Math.floor(Math.random() * items.length);
        EventSender.send("onSoundPlayRequested", items[index]);
    },

    async toggleKeybinds(key) {
        const ms = MS.instance;
        const s = ms.settingsCache.settings;
        s.quickActionStates[key] = !Settings.getActionState(s, key);
        ms.trayManager.update(s.quickActionStates);
        ms.keybindManager.raiseExternal = s.quickActionStates[key]!;
        EventSender.send("onKeybindsStateChanged", s.quickActionStates[key]);
        await ms.settingsCache.save({ quickActionStates: s.quickActionStates });
    },

    async toggleSoundOverlap(key) {
        const ms = MS.instance;
        const s = ms.settingsCache.settings;
        s.quickActionStates[key] = !Settings.getActionState(s, key);
        ms.trayManager.update(s.quickActionStates);
        EventSender.send("onOverlapSoundsStateChanged", s.quickActionStates[key]);
        await ms.settingsCache.save({ quickActionStates: s.quickActionStates });
    },

    async toggleSoundLooping(key) {
        const ms = MS.instance;
        const s = ms.settingsCache.settings;
        s.quickActionStates[key] = !Settings.getActionState(s, key);
        ms.trayManager.update(s.quickActionStates);
        EventSender.send("onLoopSoundsChanged", s.quickActionStates[key]);
        await ms.settingsCache.save({ quickActionStates: s.quickActionStates });
    },
};

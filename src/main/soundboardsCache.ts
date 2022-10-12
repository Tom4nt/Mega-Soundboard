import { promises as fs } from "fs";
import { Sound, Soundboard } from "../shared/models";
import DataAccess from "./dataAccess";
import IPCEvents, { events } from "./ipcEvents";
import MS from "./ms";

export default class SoundboardsCache {
    constructor(public readonly soundboards: Soundboard[]) { }

    async addSounds(sounds: Sound[], soundboardId: string, move: boolean, startIndex?: number): Promise<void> {
        const soundboard = this.soundboards.find((s) => s.uuid = soundboardId);
        if (!soundboard) throw new Error(`Soundboard with runtime UUID ${soundboardId} could not be found.`);

        const soundsDestination = MS.instance.settingsCache.settings.soundsLocation;
        const moveTasks: Promise<void>[] = [];
        let index = startIndex ?? 0;
        for (const sound of sounds) {
            soundboard.addSound(sound, index);
            if (move && soundsDestination)
                moveTasks.push(fs.rename(sound.path, soundsDestination));
            IPCEvents.send(events.soundAdded, { sound: sound, index: index });
            index += 1;
        }

        await Promise.all([...moveTasks, DataAccess.saveSoundboards(this.soundboards)]);
    }

    async editSound(sound: Sound): Promise<void> {
        const existing = this.findSound(sound.uuid);
        existing.soundboard.sounds[existing.index] = sound;
        IPCEvents.send(events.soundChanged, { sound: sound, soundboard: existing.soundboard });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async removeSound(uuid: string): Promise<void> {
        const existing = this.findSound(uuid);
        const sound = existing.soundboard.sounds[existing.index];
        existing.soundboard.sounds.splice(existing.index, 1);
        IPCEvents.send(events.soundRemoved, sound);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async addSoundboard(soundboard: Soundboard): Promise<void> {
        this.soundboards.push(soundboard);
        IPCEvents.send(events.soundboardAdded, soundboard);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async removeSoundboard(uuid: string): Promise<void> {
        const index = this.soundboards.findIndex((s) => s.uuid = uuid);
        this.soundboards.splice(index, 0);
        // IPCEvents.sendSoundboa
        await DataAccess.saveSoundboards(this.soundboards);
    }

    // ---

    private findSound(uuid: string): { soundboard: Soundboard, index: number } {
        for (const soundboard of this.soundboards) {
            const soundIndex = soundboard.sounds.findIndex((s) => s.uuid = uuid);
            if (soundIndex) return {
                soundboard: soundboard, index: soundIndex
            };
        }
        throw new Error(`Sound with runtime UUID ${uuid} could not be found.`);
    }
}

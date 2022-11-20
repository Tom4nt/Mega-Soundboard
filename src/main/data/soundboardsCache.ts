import { promises as fs } from "fs";
import { Sound, Soundboard } from "../../shared/models";
import DataAccess from "./dataAccess";
import EventSender from "../eventSender";
import MS from "../ms";

export default class SoundboardsCache {
    constructor(public readonly soundboards: Soundboard[]) { }

    async addSounds(sounds: Sound[], soundboardId: string, move: boolean, startIndex?: number): Promise<void> {
        const soundboard = this.soundboards.find((s) => s.uuid = soundboardId);
        if (!soundboard) throw new Error(`Soundboard with runtime UUID ${soundboardId} could not be found.`);

        const soundsDestination = MS.instance.settingsCache.settings.soundsLocation;
        const moveTasks: Promise<void>[] = [];
        let index = startIndex ?? 0;
        for (const sound of sounds) {
            soundboard.sounds.splice(index, 0, sound);
            if (move && soundsDestination)
                moveTasks.push(fs.rename(sound.path, soundsDestination));
            EventSender.send("onSoundAdded", { sound: sound, index: index });
            index += 1;
        }

        await Promise.all([...moveTasks, DataAccess.saveSoundboards(this.soundboards)]);
    }

    async editSound(sound: Sound): Promise<void> {
        const existing = this.findSound(sound.uuid);
        existing.soundboard.sounds[existing.index] = sound;
        EventSender.send("onSoundChanged", { sound: sound, soundboard: existing.soundboard });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async moveSound(soundId: string, destinationSoundboardId: string, destinationIndex: number): Promise<void> {
        const found = this.findSound(soundId);
        const sound = found.soundboard.sounds[found.index];
        const destSoundboardIndex = this.findSoundboardIndex(destinationSoundboardId);
        const destSoundboard = this.soundboards[destSoundboardIndex];

        found.soundboard.sounds.splice(found.index, 1);
        EventSender.send("onSoundRemoved", sound);
        destSoundboard.sounds.splice(destinationIndex, 0, sound);
        EventSender.send("onSoundAdded", { sound: sound, index: destinationIndex });

        await DataAccess.saveSoundboards(this.soundboards);
    }

    async removeSound(uuid: string): Promise<void> {
        const existing = this.findSound(uuid);
        const sound = existing.soundboard.sounds[existing.index];
        existing.soundboard.sounds.splice(existing.index, 1);
        EventSender.send("onSoundRemoved", sound);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async addSoundboard(soundboard: Soundboard): Promise<void> {
        this.soundboards.push(soundboard);
        EventSender.send("onSoundboardAdded", { soundboard });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async editSoundboard(soundboard: Soundboard): Promise<void> {
        const existingIndex = this.findSoundboardIndex(soundboard.uuid);
        this.soundboards[existingIndex] = soundboard;
        EventSender.send("onSoundboardChanged", soundboard);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async moveSoundboard(id: string, destinationIndex: number): Promise<void> {
        const sbIndex = this.findSoundboardIndex(id);
        const soundboard = this.soundboards[sbIndex];
        this.soundboards.splice(sbIndex, 1);
        EventSender.send("onSoundboardRemoved", soundboard);
        this.soundboards.splice(destinationIndex, 0, soundboard);
        EventSender.send("onSoundboardAdded", { soundboard, index: destinationIndex });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async removeSoundboard(uuid: string): Promise<void> {
        const index = this.soundboards.findIndex((s) => s.uuid === uuid);
        const soundboard = this.soundboards[index];
        this.soundboards.splice(index, 1);
        EventSender.send("onSoundboardRemoved", soundboard);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    findSound(uuid: string): { soundboard: Soundboard, index: number } {
        for (const soundboard of this.soundboards) {
            const soundIndex = soundboard.sounds.findIndex((s) => s.uuid === uuid);
            if (soundIndex) return {
                soundboard: soundboard, index: soundIndex
            };
        }
        throw new Error(`Sound with runtime UUID ${uuid} could not be found.`);
    }

    findSoundboardIndex(uuid: string): number {
        const soundboardIndex = this.soundboards.findIndex(x => x.uuid === uuid);
        if (soundboardIndex < 0) throw new Error(`Soundboard with runtime UUID ${uuid} could not be found.`);
        return soundboardIndex;
    }
}

import { promises as fs } from "fs";
import { Sound, Soundboard } from "../../shared/models";
import DataAccess from "./dataAccess";
import EventSender from "../eventSender";
import MS from "../ms";
import path = require("path");
import SoundboardUtils from "../utils/soundboardUtils";
import { randomUUID } from "crypto";

export default class SoundboardsCache {
    constructor(public readonly soundboards: Soundboard[]) { }

    async addSounds(sounds: Sound[], soundboardId: string, move: boolean, startIndex?: number): Promise<void> {
        const soundboard = this.soundboards.find((s) => s.uuid == soundboardId);
        if (!soundboard) throw new Error(`Soundboard with runtime UUID ${soundboardId} could not be found.`);

        const soundsDestination = MS.instance.settingsCache.settings.soundsLocation;
        const moveTasks: Promise<void>[] = [];
        let index = startIndex ?? soundboard.sounds.length + 1;
        for (const sound of sounds) {
            sound.soundboardUuid = soundboardId;
            soundboard.sounds.splice(index, 0, sound);
            if (move && soundsDestination) {
                const basename = path.basename(sound.path);
                const soundDestination = path.join(soundsDestination, basename);
                moveTasks.push(fs.rename(sound.path, soundDestination));
                sound.path = soundDestination;
            }
            EventSender.send("onSoundAdded", { sound: sound, index });
            index += 1;
        }

        EventSender.send("onSoundboardChanged", soundboard);
        await Promise.all([...moveTasks, DataAccess.saveSoundboards(this.soundboards)]);
    }

    async editSound(sound: Sound): Promise<void> {
        const [soundboard, index] = this.findSound(sound.uuid);
        soundboard.sounds[index] = sound;
        EventSender.send("onSoundChanged", { sound: sound, soundboard: soundboard });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async moveSound(
        soundId: string, destinationSoundboardId: string, destinationIndex: number
    ): Promise<void> {
        const [soundboard, index] = this.findSound(soundId);
        const sound = soundboard.sounds[index]!;
        const destSoundboardIndex = this.findSoundboardIndex(destinationSoundboardId);
        const destinationSB = this.soundboards[destSoundboardIndex]!;

        if (soundboard.linkedFolder === null && destinationSB.linkedFolder !== null)
            throw Error("Cannot move a sound to a linked Soundboard.");

        soundboard.sounds.splice(index, 1);
        EventSender.send("onSoundRemoved", sound);
        if (!Soundboard.equals(soundboard, destinationSB))
            EventSender.send("onSoundboardChanged", soundboard);

        destinationSB.sounds.splice(destinationIndex, 0, sound);
        sound.soundboardUuid = destinationSoundboardId;
        EventSender.send("onSoundAdded", { sound: sound, index: destinationIndex });
        EventSender.send("onSoundboardChanged", destinationSB);

        await DataAccess.saveSoundboards(this.soundboards);
    }

    async copySound(
        soundId: string, destinationSoundboardId: string, destinationIndex: number
    ): Promise<void> {
        const [soundboard, index] = this.findSound(soundId);
        const sound = soundboard.sounds[index]!;
        const destSoundboardIndex = this.findSoundboardIndex(destinationSoundboardId);
        const destinationSB = this.soundboards[destSoundboardIndex]!;
        const soundCopy = Sound.copy(sound, randomUUID());

        if (soundboard.linkedFolder === null && destinationSB.linkedFolder !== null)
            throw Error("Cannot copy a sound to a linked Soundboard.");

        destinationSB.sounds.splice(destinationIndex, 0, soundCopy);
        soundCopy.soundboardUuid = destinationSoundboardId;
        EventSender.send("onSoundAdded", { sound: soundCopy, index: destSoundboardIndex });
        EventSender.send("onSoundboardChanged", destinationSB);

        await DataAccess.saveSoundboards(this.soundboards);
    }

    async removeSound(uuid: string): Promise<void> {
        const [soundboard, index] = this.findSound(uuid);
        const sound = soundboard.sounds[index]!;
        soundboard.sounds.splice(index, 1);
        EventSender.send("onSoundRemoved", sound);
        EventSender.send("onSoundboardChanged", soundboard);
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
        await SoundboardUtils.syncSounds(soundboard);
        EventSender.send("onSoundboardChanged", soundboard);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async moveSoundboard(id: string, destinationIndex: number): Promise<void> {
        const sbIndex = this.findSoundboardIndex(id);
        const soundboard = this.soundboards[sbIndex]!;
        this.soundboards.splice(sbIndex, 1);
        EventSender.send("onSoundboardRemoved", soundboard);
        this.soundboards.splice(destinationIndex, 0, soundboard);
        EventSender.send("onSoundboardAdded", { soundboard, index: destinationIndex });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async removeSoundboard(uuid: string): Promise<void> {
        const index = this.findSoundboardIndex(uuid);
        const soundboard = this.soundboards[index];
        this.soundboards.splice(index, 1);
        EventSender.send("onSoundboardRemoved", soundboard);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async sortSoundboard(uuid: string): Promise<void> {
        const index = this.findSoundboardIndex(uuid);
        const soundboard = this.soundboards[index]!;
        soundboard.sounds = soundboard.sounds.sort((a, b) => Sound.compare(a, b));
        EventSender.send("onSoundboardChanged", soundboard);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    findSound(uuid: string): [Soundboard, number] {
        for (const soundboard of this.soundboards) {
            const soundIndex = soundboard.sounds.findIndex((s) => s.uuid === uuid);
            if (soundIndex >= 0) return [soundboard, soundIndex];
        }
        throw new Error(`Sound with runtime UUID ${uuid} could not be found.`);
    }

    findSoundboardIndex(uuid: string): number {
        const soundboardIndex = this.soundboards.findIndex(x => x.uuid === uuid);
        if (soundboardIndex < 0) throw new Error(`Soundboard with runtime UUID ${uuid} could not be found.`);
        return soundboardIndex;
    }
}

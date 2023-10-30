import { promises as fs } from "fs";
import DataAccess from "./dataAccess";
import EventSender from "../eventSender";
import MS from "../ms";
import path = require("path");
import SoundboardUtils from "../utils/soundboardUtils";
import { randomUUID } from "crypto";
import { Sound } from "../../shared/models/sound";
import { Soundboard, getQuickSoundboard } from "../../shared/models/soundboard";
import { compare, copy } from "../../shared/models/playable";

export default class SoundboardsCache {
    constructor(public readonly soundboards: Soundboard[]) { }

    async addSounds(paths: Sound[], soundboardId: string | null, move: boolean, startIndex?: number): Promise<Soundboard> {
        const soundboard = await this.getSoundboard(soundboardId);
        const soundsDestination = MS.instance.settingsCache.settings.soundsLocation;
        const moveTasks: Promise<void>[] = [];
        let index = startIndex ?? soundboard.playables.length + 1;
        for (const sound of paths) {
            sound.soundboardUuid = soundboard.uuid;
            soundboard.playables.splice(index, 0, sound);
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
        return soundboard;
    }

    async editSound(sound: Sound): Promise<void> {
        const [soundboard, index] = this.findPlayable(sound.uuid);
        soundboard.playables[index] = sound;
        EventSender.send("onSoundChanged", { sound: sound, soundboard: soundboard });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async movePlayable(
        playableId: string, destinationSoundboardId: string | null, destinationIndex: number, doesCopy: boolean
    ): Promise<Soundboard> {
        const [sourceSB, index] = this.findPlayable(playableId);
        let playable = sourceSB.playables[index]!;
        const destinationSB = await this.getSoundboard(destinationSoundboardId);
        destinationSoundboardId = destinationSB.uuid;

        if (sourceSB.linkedFolder === null && destinationSB.linkedFolder !== null)
            throw Error(`Cannot ${doesCopy ? "copy" : "move"} a sound to a linked Soundboard.`);

        if (doesCopy) {
            playable = copy(playable, randomUUID, destinationSoundboardId);
        } else {
            sourceSB.playables.splice(index, 1);
            EventSender.send("onSoundRemoved", playable);
            EventSender.send("onSoundboardChanged", sourceSB);
        }

        destinationSB.playables.splice(destinationIndex, 0, playable);
        playable.soundboardUuid = destinationSoundboardId;
        EventSender.send("onSoundAdded", { sound: playable, index: destinationIndex });
        EventSender.send("onSoundboardChanged", destinationSB);

        await DataAccess.saveSoundboards(this.soundboards);
        return destinationSB;
    }

    // TODO: Recursively remove from groups.
    async removePlayable(uuid: string): Promise<void> {
        const [soundboard, index] = this.findPlayable(uuid);
        const sound = soundboard.playables[index]!;
        soundboard.playables.splice(index, 1);
        EventSender.send("onSoundRemoved", sound);
        EventSender.send("onSoundboardChanged", soundboard);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async addSoundboard(soundboard: Soundboard): Promise<void> {
        this.soundboards.splice(0, 0, soundboard);
        EventSender.send("onSoundboardAdded", { soundboard, index: 0 });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async addQuickSoundboard(): Promise<Soundboard> {
        const sb = getQuickSoundboard(randomUUID());
        await this.addSoundboard(sb);
        return sb;
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
        soundboard.playables = soundboard.playables.sort((a, b) => compare(a, b));
        EventSender.send("onSoundboardSoundsSorted", soundboard); // TODO: Rename events: "Sounds" to "Playables".
        EventSender.send("onSoundboardChanged", soundboard);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    findSoundboardIndex(uuid: string): number {
        const soundboardIndex = this.soundboards.findIndex(x => x.uuid === uuid);
        if (soundboardIndex < 0) throw new Error(`Soundboard with runtime UUID ${uuid} could not be found.`);
        return soundboardIndex;
    }

    private findPlayable(uuid: string): [Soundboard, number] {
        for (const soundboard of this.soundboards) {
            const playableIndex = soundboard.playables.findIndex((s) => s.uuid === uuid);
            if (playableIndex >= 0) return [soundboard, playableIndex];
        }
        throw new Error(`Playable with runtime UUID ${uuid} could not be found.`);
    }

    private async getSoundboard(uuid: string | null): Promise<Soundboard> {
        if (uuid) {
            const destSoundboardIndex = this.findSoundboardIndex(uuid);
            return this.soundboards[destSoundboardIndex]!;
        } else {
            return await MS.instance.soundboardsCache.addQuickSoundboard();
        }
    }
}

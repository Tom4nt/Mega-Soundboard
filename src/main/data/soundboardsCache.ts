import { promises as fs } from "fs";
import DataAccess from "./dataAccess";
import EventSender from "../eventSender";
import MS from "../ms";
import path = require("path");
import SoundboardUtils from "../utils/soundboardUtils";
import { randomUUID } from "crypto";
import { Sound } from "../../shared/models/sound";
import { Soundboard, getDefault, isSoundboard } from "../../shared/models/soundboard";
import { Playable, compare, copy } from "../../shared/models/playable";
import { Container, findContainer, findInContainer } from "../../shared/models/container";

export default class SoundboardsCache {
    constructor(public readonly soundboards: Soundboard[]) { }

    async addSounds(paths: Sound[], sourceId: string | null, move: boolean, startIndex?: number): Promise<Container> {
        const source = await this.getContainer(sourceId);
        const destinationPath = MS.instance.settingsCache.settings.soundsLocation;
        const moveTasks: Promise<void>[] = [];
        let index = startIndex ?? source.playables.length + 1;
        for (const sound of paths) {
            sound.soundboardUuid = source.uuid;
            source.playables.splice(index, 0, sound);
            if (move && destinationPath) {
                const basename = path.basename(sound.path);
                const soundDestination = path.join(destinationPath, basename);
                moveTasks.push(fs.rename(sound.path, soundDestination));
                sound.path = soundDestination;
            }
            EventSender.send("onPlayableAdded", { playable: sound, index });
            index += 1;
        }

        await Promise.all([...moveTasks, DataAccess.saveSoundboards(this.soundboards)]);
        return source;
    }

    async editPlayable(playable: Playable): Promise<void> {
        const [container, index] = this.findPlayable(playable.uuid);
        container.playables[index] = playable;
        EventSender.send("onPlayableChanged", playable);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async movePlayable(
        playableId: string, destinationId: string | null, destinationIndex: number, doesCopy: boolean
    ): Promise<Container> {
        const [source, index] = this.findPlayable(playableId);
        let playable = source.playables[index]!;
        const destination = await this.getContainer(destinationId);
        destinationId = destination.uuid;

        if (isSoundboard(destination) && destination.linkedFolder !== null)
            throw Error(`Cannot ${doesCopy ? "copy" : "move"} a sound to a linked Soundboard.`);

        if (doesCopy) {
            playable = copy(playable, randomUUID, destinationId);
        } else {
            source.playables.splice(index, 1);
            EventSender.send("onPlayableRemoved", playable);
        }

        destination.playables.splice(destinationIndex, 0, playable);
        playable.soundboardUuid = destinationId;
        EventSender.send("onPlayableAdded", { playable, index: destinationIndex });

        await DataAccess.saveSoundboards(this.soundboards);
        return destination;
    }

    async removePlayable(uuid: string): Promise<void> {
        const [source, index] = this.findPlayable(uuid);
        const playable = source.playables[index]!;
        source.playables.splice(index, 1);
        EventSender.send("onPlayableRemoved", playable);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async addSoundboard(soundboard: Soundboard): Promise<void> {
        this.soundboards.splice(0, 0, soundboard);
        EventSender.send("onSoundboardAdded", { soundboard, index: 0 });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async addQuickSoundboard(): Promise<Soundboard> {
        const sb = getDefault(randomUUID(), "Quick Sounds");
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

    async sortContainer(uuid: string): Promise<void> {
        const container = await this.getContainer(uuid);
        container.playables = container.playables.sort((a, b) => compare(a, b));
        EventSender.send("onContainerSorted", container);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    findSoundboardIndex(uuid: string): number {
        const soundboardIndex = this.soundboards.findIndex(x => x.uuid === uuid);
        if (soundboardIndex < 0) throw new Error(`Soundboard with runtime UUID ${uuid} could not be found.`);
        return soundboardIndex;
    }

    private findPlayable(uuid: string): [Container, number] {
        for (const soundboard of this.soundboards) {
            const res = findInContainer(soundboard, uuid);
            if (res) return res;
        }
        throw new Error(`Cannot find playable container with runtime uuid ${uuid}.`);
    }

    private async getContainer(uuid: string | null): Promise<Container> {
        if (uuid) {
            const sb = findContainer(this.soundboards, uuid);
            if (sb) return sb;
        }
        return await MS.instance.soundboardsCache.addQuickSoundboard();
    }
}

import { promises as fs } from "fs";
import DataAccess from "./dataAccess";
import EventSender from "../eventSender";
import MS from "../ms";
import path = require("path");
import { Soundboard } from "./models/soundboard";
import { IPlayableData, ISoundData, ISoundboardData, PlayData } from "../../shared/models/data";
import { Sound } from "./models/sound";
import { Group } from "./models/group";
import { ICommon, ICommonContainer, IPlayable, IPlayableContainer } from "./models/interfaces";
import { isPlayableContainer } from "../utils/utils";
import { ContainerSortedArgs } from "../../shared/interfaces";

export default class SoundboardsCache {
    constructor(public readonly soundboards: Soundboard[]) { }

    async addSounds(
        sounds: ISoundData[], destinationId: string | null, move: boolean, startIndex?: number
    ): Promise<ICommonContainer> {
        const targetContainer = await this.getContainer(destinationId);
        const destinationPath = MS.instance.settingsCache.settings.soundsLocation;
        const moveTasks: Promise<void>[] = [];
        let index = startIndex ?? targetContainer.getPlayables().length + 1;
        for (const soundData of sounds) {
            const sound = Sound.fromData(soundData);
            targetContainer.addPlayable(sound, index);
            if (move && destinationPath) {
                const basename = path.basename(sound.path);
                const soundDestination = path.join(destinationPath, basename);
                moveTasks.push(fs.rename(sound.path, soundDestination));
                sound.path = soundDestination;
            }
            EventSender.send("onPlayableAdded", { parentUuid: targetContainer.uuid, playable: soundData, index });
            index += 1;
        }

        await Promise.all([...moveTasks, DataAccess.saveSoundboards(this.soundboards)]);
        return targetContainer;
    }

    async editPlayable(data: IPlayableData): Promise<void> {
        const playable = this.findPlayable(data.uuid);
        playable.edit(data);
        EventSender.send("onPlayableChanged", data);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async movePlayable(
        playableId: string, destinationId: string | null, destinationIndex: number, copies: boolean
    ): Promise<ICommon> {
        let playable = this.findPlayable(playableId);
        const destination = await this.getContainer(destinationId);
        destinationId = destination.uuid;

        if (Soundboard.isSoundboard(destination) && destination.linkedFolder !== null)
            throw Error(`Cannot ${copies ? "copy" : "move"} a sound to a linked Soundboard.`);

        const data = { ...playable, isGroup: Group.isGroup(playable) };
        if (copies) {
            playable = playable.copy();
        } else {
            playable.parent?.removePlayable(playable);
            EventSender.send("onPlayableRemoved", data);
        }

        destination.addPlayable(playable, destinationIndex);
        EventSender.send("onPlayableAdded", { parentUuid: destinationId, playable: data, index: destinationIndex });

        await DataAccess.saveSoundboards(this.soundboards);
        return destination;
    }

    async removePlayable(uuid: string): Promise<void> {
        const playable = this.findPlayable(uuid);
        if (playable.parent == null) return; // Cannot be removed because it's not in a parent.
        playable.parent.removePlayable(playable);
        EventSender.send("onPlayableRemoved", { ...playable, isGroup: Group.isGroup(playable) });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async addSoundboard(soundboardData: ISoundboardData): Promise<void> {
        const soundboard = Soundboard.fromData(soundboardData);
        await this.addSoundboardInternal(soundboard);
    }

    async addQuickSoundboard(): Promise<Soundboard> {
        const sb = Soundboard.getDefault("Quick Sounds");
        await this.addSoundboardInternal(sb);
        return sb;
    }

    async editSoundboard(soundboardData: ISoundboardData): Promise<void> {
        const soundboard = this.soundboards.find(s => s.uuid == soundboardData.uuid);
        if (!soundboard) throw new Error("Soundboard not found.");
        soundboard.edit(soundboardData);
        await soundboard.syncSounds();
        EventSender.send("onSoundboardChanged", soundboardData);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async moveSoundboard(id: string, destinationIndex: number): Promise<void> {
        const sbIndex = this.findSoundboardIndex(id);
        const soundboard = this.soundboards[sbIndex]!;
        this.soundboards.splice(sbIndex, 1);
        EventSender.send("onSoundboardRemoved", soundboard.asData());
        this.soundboards.splice(destinationIndex, 0, soundboard);
        EventSender.send("onSoundboardAdded", { soundboard: soundboard.asData(), index: destinationIndex });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async removeSoundboard(uuid: string): Promise<void> {
        const index = this.findSoundboardIndex(uuid);
        const soundboard = this.soundboards[index];
        this.soundboards.splice(index, 1);
        EventSender.send("onSoundboardRemoved", soundboard?.asData());
        await DataAccess.saveSoundboards(this.soundboards);
    }

    async sortContainer(uuid: string): Promise<void> {
        const container = await this.getContainer(uuid);
        container.sortPlayables();
        const args: ContainerSortedArgs = {
            containerUuid: uuid,
            itemsUuids: container.getPlayables().map(p => p.uuid),
        };
        EventSender.send("onContainerSorted", args);
        await DataAccess.saveSoundboards(this.soundboards);
    }

    /** Finds the root container (Soundboard) where the playable whith the specified uuid is. */
    findRoot(playableUuid: string): Soundboard | undefined {
        for (const soundboard of this.soundboards) {
            const result = soundboard.findPlayablesRecursive(p => p.uuid === playableUuid);
            if (result.length > 0) return soundboard;
        }
        return undefined;
    }

    findSoundboardIndex(uuid: string): number {
        const soundboardIndex = this.soundboards.findIndex(x => x.uuid === uuid);
        if (soundboardIndex < 0) throw new Error(`Soundboard with runtime UUID ${uuid} could not be found.`);
        return soundboardIndex;
    }

    findPlayable(uuid: string): IPlayable {
        for (const soundboard of this.soundboards) {
            const res = soundboard.findPlayablesRecursive(p => p.uuid == uuid);
            if (res.length > 0) return res[0]!;
        }
        throw new Error(`Cannot find playable container with runtime uuid ${uuid}.`);
    }

    getPlayData(uuid: string): PlayData {
        const playable = MS.instance.soundboardsCache.findPlayable(uuid);
        // TODO: Hierarchy
        return { mainUuid: uuid, hierarchy: [], path: playable.getAudioPath(), volume: playable.getVolume() };
    }

    private async addSoundboardInternal(soundboard: Soundboard): Promise<void> {
        this.soundboards.splice(0, 0, soundboard);
        EventSender.send("onSoundboardAdded", { soundboard: soundboard.asData(), index: 0 });
        await DataAccess.saveSoundboards(this.soundboards);
    }

    private async getContainer(uuid: string | null): Promise<ICommonContainer> {
        if (uuid) {
            for (const sb of this.soundboards) {
                if (sb.uuid == uuid) return sb;
                const found = sb.findPlayablesRecursive(p => isPlayableContainer(p) && p.uuid == uuid);
                if (found.length > 0) return found[0]! as IPlayableContainer;
            }
        }
        return await MS.instance.soundboardsCache.addQuickSoundboard();
    }
}

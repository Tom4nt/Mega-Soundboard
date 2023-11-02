import { isSound, Playable } from "../../shared/models/playable";
import { Soundboard } from "../../shared/models/soundboard";
import { MultiSoundModal, SoundboardModal, SoundModal } from "../modals";

export default class Actions {

    static async addSounds(paths: string[], soundboardId: string | null, index?: number): Promise<void> {
        if (paths.length <= 0) return;
        const newSounds = await window.actions.getNewSoundsFromPaths(paths);

        if (paths.length == 1) {
            const modal = new SoundModal(newSounds[0]!, true);
            modal.open();
            modal.onSave.addHandler(e => {
                void window.actions.addSounds([e.sound], soundboardId, e.moveRequested, index);
            });

        } else {
            const multiSoundModal = new MultiSoundModal(newSounds.length);
            multiSoundModal.onConfirmed.addHandler(e => {
                void window.actions.addSounds(newSounds, soundboardId, e.moveRequested, index);
            });
            multiSoundModal.open();
        }
    }

    static editPlayable(playable: Playable): void {
        if (!isSound(playable)) return; // TODO: Implement edit group.
        const editModal = new SoundModal(playable, false);
        editModal.open();
        editModal.onSave.addHandler(() => {
            window.actions.editPlayable(playable);
        });

        editModal.onRemove.addHandler(() => {
            window.actions.deletePlayable(playable.uuid);
        });
    }

    static async addSoundboard(): Promise<void> {
        const soundboard = await window.actions.getNewSoundboard();
        const modal = new SoundboardModal(soundboard, true, false);
        modal.open();
        modal.onSaved.addHandler(soundboard => {
            window.actions.addSoundboard(soundboard);
        });
    }

    static async editSoundboard(soundboard: Soundboard): Promise<void> {
        const isLast = (await window.actions.getSoundboards()).length <= 1;
        const editModal = new SoundboardModal(soundboard, false, isLast);
        editModal.open();
        editModal.onSaved.addHandler(s => {
            window.actions.editSoundboard(s);
        });

        editModal.onRemove.addHandler(s => {
            window.actions.deleteSoundboard(s.uuid);
        });
    }
}

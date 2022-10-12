import { Sound, Soundboard } from "../../shared/models";
import { MultiSoundModal, SoundboardModal, SoundModal } from "../modals";

export default class Actions {

    static async addSounds(paths: string[], soundboardId: string, index?: number): Promise<void> {
        if (paths.length <= 0) return;
        const newSounds = await window.functions.getNewSoundsFromPaths(paths);

        if (paths.length == 1) {
            const modal = new SoundModal(newSounds[0], true);
            modal.open();
            modal.onSave.addHandler(e => {
                window.actions.addSounds([e.sound], soundboardId, e.moveRequested, index);
            });

        } else {
            const multiSoundModal = new MultiSoundModal(newSounds.length);
            multiSoundModal.onConfirmed.addHandler(e => {
                window.actions.addSounds(newSounds, soundboardId, e.moveRequested, index);
            });
            multiSoundModal.open();
        }
    }

    static editSound(sound: Sound): void {
        const editModal = new SoundModal(sound, false);
        editModal.open();
        editModal.onSave.addHandler(() => {
            window.actions.editSound(sound);
        });

        editModal.onRemove.addHandler(() => {
            window.actions.deleteSound(sound.uuid);
        });
    }

    static async addSoundboard(): Promise<void> {
        const soundboard = await window.functions.getNewSoundboard();
        const modal = new SoundboardModal(soundboard, true);
        modal.open();
        modal.onSaved.addHandler(soundboard => {
            window.actions.addSoundboard(soundboard);
        });
    }

    static editSoundboard(soundboard: Soundboard): void {
        const editModal = new SoundboardModal(soundboard, false);
        editModal.open();
        editModal.onSaved.addHandler(s => {
            window.actions.editSoundboard(s);
        });

        editModal.onRemove.addHandler(s => {
            window.actions.deleteSoundboard(s.uuid);
        });
    }
}
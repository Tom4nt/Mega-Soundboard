// TODO: Add an action for editing a sound.

import { Sound, Soundboard } from "../../shared/models";
import { MultiSoundModal, SoundboardModal, SoundModal } from "../modals";

export default class Actions {

    static async createSound(path: string, soundboardId: string, index?: number): Promise<void> {
        const name = await window.functions.getNameFromPath(path);
        const newSound = new Sound("", name, path, 100, []); // TODO: New UUID
        const soundModal = new SoundModal(newSound);
        soundModal.onSave.addHandler(s => {
            window.actions.addSound(s, soundboardId, index);
        });
        soundModal.open();
    }

    static createSounds(count: number, soundboardId: string): void {
        const modal = new MultiSoundModal(count);
        modal.onAdded.addHandler(ss => {
            window.actions.addSounds(ss, soundboardId);
        });
        modal.open();
    }

    static editSoundboard(soundboard: Soundboard): void {
        const editModal = new SoundboardModal(soundboard);
        editModal.open();
        editModal.onSaved.addHandler(s => {
            window.actions.editSoundboard(s);
        });

        editModal.onRemove.addHandler(s => {
            window.actions.deleteSoundboard(s.uuid);
        });
    }
}

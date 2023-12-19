import { MultiSoundModal, SoundboardModal, SoundModal } from "../modals";

export default class Actions {

    /** Creates sounds for the paths and opens the dialog to add them to the specified soundboard.
     * If null, creates a new soundboard. Returns the soundboard uuid when the dialog is closed. */
    static async addSounds(paths: string[], soundboardId: string | null, index?: number): Promise<string> {
        if (paths.length <= 0) return "";
        const newSounds = await window.actions.getNewSoundsFromPaths(paths);

        if (paths.length == 1) {
            const modal = new SoundModal(newSounds[0]!, true, false);
            modal.open();
            return await new Promise<string>(r => {
                modal.onSave.addHandler(e => {
                    r(window.actions.addSounds([e.sound], soundboardId, e.moveRequested, index));
                });
            });
        } else {
            const multiSoundModal = new MultiSoundModal(newSounds.length);
            multiSoundModal.open();
            return await new Promise<string>(r => {
                multiSoundModal.onConfirmed.addHandler(e => {
                    r(window.actions.addSounds(newSounds, soundboardId, e.moveRequested, index));
                });
            });
        }
    }

    static async editPlayable(playable: Playable): Promise<void> {
        if (!isSound(playable)) return; // TODO: Implement edit group.
        const root = await window.actions.getPlayableRoot(playable.uuid);
        const editModal = new SoundModal(playable, false, root?.linkedFolder != null);
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

import { MultiSoundModal, SoundboardModal, SoundModal } from "../modals";
import GroupModal from "../modals/groupModal";

export default class Actions {

	/** Creates sounds for the paths and opens the dialog to add them to the specified container.
	 * If null, creates a new soundboard.
	 * Returns the container uuid when the sound is saved, or null if the user canceled the operation. */
	static async addSounds(paths: string[], containerUuid: string | null, index?: number): Promise<string | null> {
		if (paths.length == 1) {
			const modal = new SoundModal();
			return await modal.openForAdd(paths[0]!, containerUuid, index);
		} else {
			const modal = new MultiSoundModal();
			return await modal.openForAdd(paths, containerUuid, index);
		}
	}

	static async editPlayable(uuid: string, isGroup: boolean): Promise<void> {
		if (isGroup) {
			const modal = new GroupModal();
			await modal.openForEdit(uuid);
		} else {
			const modal = new SoundModal();
			await modal.openForEdit(uuid);
		}
	}

	static async addSoundboard(): Promise<void> {
		const modal = new SoundboardModal();
		await modal.openForAdd();
	}

	static async editSoundboard(uuid: string): Promise<void> {
		const editModal = new SoundboardModal();
		await editModal.openForEdit(uuid);
	}
}

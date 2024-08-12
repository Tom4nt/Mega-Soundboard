import { FileSelector, KeyRecorder, Slider, TextField } from "../elements";
import { Modal } from "../modals";
import { ISoundboardData } from "../../shared/models/dataInterfaces";

export default class SoundboardModal extends Modal {
	private nameElement!: TextField;
	private keysElement!: KeyRecorder;
	private volumeElement!: Slider;
	private folderElement!: FileSelector;
	private okButton!: HTMLButtonElement;
	private removeButton!: HTMLButtonElement;

	private loadedSoundboard?: ISoundboardData;
	private isNew = false;
	private canRemove = false;

	constructor() { super(false); }

	public async openForAdd(): Promise<void> {
		const sb = await window.actions.getNewSoundboard();
		this.modalTitle = "Add Soundboard";
		this.loadedSoundboard = sb;
		this.isNew = true;
		this.canRemove = false;

		await super.open();
	}

	public async openForEdit(uuid: string): Promise<void> {
		const soundboard = await window.actions.getSoundboard(uuid);
		this.loadedSoundboard = soundboard.soundboard;
		this.canRemove = !soundboard.isAlone;
		this.isNew = false;
		this.modalTitle = "Edit Soundboard";

		await super.open();
	}

	protected connectedCallback(): void {
		super.connectedCallback();
		this.update();
	}

	protected getContent(): HTMLElement[] {
		this.nameElement = new TextField("Name");
		this.keysElement = new KeyRecorder();
		this.volumeElement = new Slider("Volume");
		this.folderElement = new FileSelector("Linked Folder (Optional)", "folder");

		this.folderElement.onValueChanged.addHandler(async () => {
			if (!this.nameElement.value) {
				const name = await window.actions.getNameFromPath(this.folderElement.value);
				this.nameElement.value = name;
			}
		});

		return [
			this.nameElement,
			this.folderElement,
			this.volumeElement,
			Modal.getLabel("Set Active"),
			this.keysElement,
		];
	}

	protected getFooterButtons(): HTMLButtonElement[] {
		this.okButton = Modal.getButton("save", () => { void this.save(); });
		this.removeButton = Modal.getButton("remove", () => { this.removeSoundboard(); }, true, true);

		const buttons = [
			this.removeButton,
			Modal.getButton("close", () => { super.close(); }),
			this.okButton,
		];

		return buttons;
	}

	protected canCloseWithKey(): boolean {
		return !this.keysElement.isRecording;
	}

	private update(): void {
		if (!this.loadedSoundboard) throw Error("Calling openForAdd or openForEdit is required.");

		this.nameElement.value = this.loadedSoundboard.name;
		this.keysElement.keys = this.loadedSoundboard.keys;
		this.volumeElement.value = this.loadedSoundboard.volume;
		if (this.loadedSoundboard.linkedFolder) this.folderElement.value = this.loadedSoundboard.linkedFolder;

		const displaysFolderField = this.loadedSoundboard.linkedFolder || !this.loadedSoundboard.hasSounds;
		this.folderElement.style.display = displaysFolderField ? "" : "none";

		this.okButton.innerHTML = this.isNew ? "Add" : "Save";
		this.removeButton.style.display = !this.canRemove || this.isNew ? "none" : "";
	}

	private async validate(finalPath: string | null): Promise<boolean> {
		let valid = true;
		if (!this.nameElement.value || !this.nameElement.value.trim()) {
			this.nameElement.warn();
			valid = false;
		}

		const isEmpty = this.folderElement.value === "";
		if (!isEmpty && finalPath === null) {
			this.folderElement.warn();
			valid = false;
		}

		return valid;
	}

	private async save(): Promise<void> {
		if (!this.loadedSoundboard) throw Error("Calling openForAdd or openForEdit is required.");
		const path = await window.actions.parsePath(this.folderElement.value);
		if (! await this.validate(path)) return;

		this.loadedSoundboard.name = this.nameElement.value;
		this.loadedSoundboard.keys = this.keysElement.keys;
		this.loadedSoundboard.volume = this.volumeElement.value;
		if (this.folderElement.value) this.loadedSoundboard.linkedFolder = path;

		if (this.isNew) {
			window.actions.addSoundboard(this.loadedSoundboard);
		} else {
			window.actions.editSoundboard(this.loadedSoundboard);
		}

		this.close();
	}

	private removeSoundboard(): void {
		if (!this.loadedSoundboard) throw Error("Calling openForAdd or openForEdit is required.");
		window.actions.deleteSoundboard(this.loadedSoundboard.uuid);
		this.close();
	}
}

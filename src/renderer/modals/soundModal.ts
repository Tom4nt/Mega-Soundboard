import { FileSelector, InfoBalloon, KeyRecorder, Slider, TextField, Toggler } from "../elements";
import { Modal } from "../modals";
import { ISoundData } from "../../shared/models/dataInterfaces";
import Utils from "../util/utils";

export default class SoundModal extends Modal {
	private nameElement!: TextField;
	private moveElement!: Toggler;
	private pathElement!: FileSelector;
	private volumeElement!: Slider;
	private keysElement!: KeyRecorder;
	private okButton!: HTMLButtonElement;
	private removeButton!: HTMLButtonElement;

	private _isSaved = false;
	private loadedSound?: ISoundData;
	private isNew = false;
	private isInLinkedSoundboard = false;
	private parentUuid: string | null = null;
	private index?: number;

	constructor() { super(false); }

	public get isSaved(): boolean { return this._isSaved; }

	public async openForAdd(path: string, parentUuid: string | null, index?: number): Promise<string | null> {
		const sounds = await window.actions.getSoundDataFromPaths([path]);
		this.modalTitle = "Add Sound";
		this.loadedSound = sounds[0]!;
		this.parentUuid = parentUuid;
		this.index = index;
		this.isNew = true;

		await super.open();
		return this.isSaved ? this.parentUuid : null; // This is set on save.
	}

	public async openForEdit(uuid: string): Promise<void> {
		const playable = await window.actions.getPlayable(uuid);
		if (!playable) throw Error(`Playable with uuid ${uuid} could not be found.`);
		if (playable.data.isGroup) throw Error(`Cannot edit a group with the SoundModal.`);

		this.modalTitle = "Edit Sound";
		this.loadedSound = playable.data as ISoundData;
		this.isNew = false;
		this.isInLinkedSoundboard = playable.isInLinkedSoundboard;

		await super.open();
	}

	protected canCloseWithKey(): boolean {
		return !this.keysElement.isRecording;
	}

	protected connectedCallback(): void {
		super.connectedCallback();
		this.update();
	}

	protected getContent(): HTMLElement[] {
		this.nameElement = new TextField("Name");
		this.moveElement = new Toggler("Move sound", new InfoBalloon("The sound file will be moved to the location defined in Settings.", "top"));
		this.pathElement = new FileSelector("Path", "sound");
		this.volumeElement = new Slider(Utils.volumeLabelGenerator, 1);
		this.volumeElement.step = 0.01;
		this.keysElement = new KeyRecorder();

		this.pathElement.onValueChanged.addHandler(async v => {
			if (!this.nameElement.value) {
				const name = await window.actions.getNameFromPath(v);
				this.nameElement.value = name;
			}
		});

		return [
			this.nameElement,
			this.moveElement,
			this.pathElement,
			this.volumeElement,
			Modal.getLabel("Play"),
			this.keysElement,
		];
	}

	protected getFooterButtons(): HTMLButtonElement[] {
		this.okButton = Modal.getButton("ok", () => { void this.save(); }, false, false);
		this.removeButton = Modal.getButton("remove", () => { this.removeSound(); }, true, true);

		const buttons = [
			this.removeButton,
			Modal.getButton("close", () => { this.close(); }, false, false),
			this.okButton
		];

		return buttons;
	}

	private update(): void {
		if (!this.loadedSound) throw Error("Calling openForAdd or openForEdit is required.");

		this.nameElement.value = this.loadedSound.name;
		this.pathElement.value = this.loadedSound.path;
		this.volumeElement.value = this.loadedSound.volume;
		this.keysElement.keys = this.loadedSound.keys;

		this.moveElement.style.display = this.isNew ? "" : "none";
		this.pathElement.style.display = !this.isInLinkedSoundboard ? "" : "none";
		this.removeButton.style.display = this.isNew || this.isInLinkedSoundboard ? "none" : "";

		this.okButton.innerHTML = this.isNew ? "Add" : "Save";
	}

	private async validate(finalPath: string | null): Promise<boolean> {
		let valid = true;
		if (!this.nameElement.value || !this.nameElement.value.trim()) {
			this.nameElement.warn();
			valid = false;
		}

		if (!finalPath) {
			this.pathElement.warn();
			valid = false;
		}

		return valid;
	}

	private async save(): Promise<void> {
		if (!this.loadedSound) throw Error("Calling openForAdd or openForEdit is required.");

		const path = await window.actions.parsePath(this.pathElement.value);
		if (!await this.validate(path) || !path) return;

		this.loadedSound.name = this.nameElement.value;
		this.loadedSound.path = path;
		this.loadedSound.volume = this.volumeElement.value;
		this.loadedSound.keys = this.keysElement.keys;

		if (this.isNew) {
			this.parentUuid = await window.actions.addSounds([this.loadedSound], this.parentUuid, this.moveElement.isOn, this.index);
		} else {
			window.actions.editPlayable(this.loadedSound);
		}

		this._isSaved = true;
		this.close();
	}

	private removeSound(): void {
		if (!this.loadedSound) throw Error("Calling openForAdd or openForEdit is required.");
		window.actions.deletePlayable(this.loadedSound.uuid);
		this.close();
	}
}

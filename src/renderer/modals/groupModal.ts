import { Dropdown, KeyRecorder, Slider, TextField } from "../elements";
import { Modal } from "../modals";
import { GroupMode, IGroupData } from "../../shared/models/dataInterfaces";
import { DropDownItem } from "../elements/dropdown";
import Utils from "../util/utils";

export default class GroupModal extends Modal {
	private nameElement!: TextField;
	private modeElement!: Dropdown;
	private volumeElement!: Slider;
	private keysElement!: KeyRecorder;
	private okButton!: HTMLButtonElement;
	private removeButton!: HTMLButtonElement;
	private ungroupButton!: HTMLButtonElement;

	private loadedGroup?: IGroupData;
	private isInLinkedSoundboard = false;

	constructor() {
		super(false);
		this.modalTitle = "Edit Group";
	}

	public async openForEdit(uuid: string): Promise<void> {
		const playable = await window.actions.getPlayable(uuid);
		if (!playable) throw Error(`Playable with uuid ${uuid} could not be found.`);
		if (!playable.data.isGroup) throw Error(`Cannot edit a non-group playable with the GroupModal.`);

		this.loadedGroup = playable.data as IGroupData;
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
		this.modeElement = new Dropdown();
		this.volumeElement = new Slider(Utils.volumeLabelGenerator, 1);
		this.volumeElement.step = 0.01;
		this.keysElement = new KeyRecorder();

		return [
			this.nameElement,
			this.modeElement,
			this.volumeElement,
			Modal.getLabel("Play"),
			this.keysElement,
		];
	}

	protected getFooterButtons(): HTMLButtonElement[] {
		this.okButton = Modal.getButton("ok", () => { void this.save(); }, false, false);
		this.removeButton = Modal.getButton("remove", () => { this.removeGroup(); }, true, true);
		this.ungroupButton = Modal.getButton("ungroup", () => { this.ungroup(); }, true, false);

		const buttons = [
			this.ungroupButton,
			this.removeButton,
			Modal.getButton("close", () => { this.close(); }, false, false),
			this.okButton
		];

		return buttons;
	}

	private update(): void {
		if (!this.loadedGroup) throw Error("Calling openForEdit is required.");

		this.modeElement.addItems(
			new DropDownItem("Random", "random" as GroupMode),
			new DropDownItem("Sequence", "sequence" as GroupMode),
			new DropDownItem("First", "first" as GroupMode),
			new DropDownItem("Combine", "combine" as GroupMode),
		);

		this.nameElement.value = this.loadedGroup.name;
		this.modeElement.selectItemWithValue(this.loadedGroup.mode);
		this.volumeElement.value = this.loadedGroup.volume;
		this.keysElement.keys = this.loadedGroup.keys;

		this.removeButton.style.display = this.isInLinkedSoundboard ? "none" : "";
		this.okButton.innerHTML = "Save";
	}

	private async validate(): Promise<boolean> {
		let valid = true;
		if (!this.nameElement.value || !this.nameElement.value.trim()) {
			this.nameElement.warn();
			valid = false;
		}

		return valid;
	}

	private async save(): Promise<void> {
		if (!this.loadedGroup) throw Error("Calling openForEdit is required.");
		if (!await this.validate()) return;

		this.loadedGroup.name = this.nameElement.value;
		this.loadedGroup.mode = this.modeElement.selectedItem?.value as GroupMode;
		this.loadedGroup.volume = this.volumeElement.value;
		this.loadedGroup.keys = this.keysElement.keys;

		window.actions.editPlayable(this.loadedGroup);

		this.close();
	}

	private removeGroup(): void {
		if (!this.loadedGroup) throw Error("Calling openForEdit is required.");
		window.actions.deletePlayable(this.loadedGroup.uuid);
		this.close();
	}

	private ungroup(): void {
		if (!this.loadedGroup) throw Error("Calling openForEdit is required.");
		void window.actions.ungroupGroup(this.loadedGroup.uuid);
		this.close();
	}
}

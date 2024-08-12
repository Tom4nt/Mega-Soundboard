import { InfoBalloon, Toggler } from "../elements";
import { Modal } from "../modals";
import { ISoundData } from "../../shared/models/dataInterfaces";

export default class MultiSoundModal extends Modal {
	private moveToggler!: Toggler;
	private _isSaved = false;

	private sounds?: ISoundData[];
	private parentUuid: string | null = null;
	private startIndex?: number;

	constructor() { super(false); }

	public get isSaved(): boolean { return this._isSaved; }

	public async openForAdd(paths: string[], parentUuid: string | null, startIndex?: number): Promise<string | null> {
		const soundData = await window.actions.getSoundDataFromPaths(paths);
		this.sounds = soundData;
		this.parentUuid = parentUuid;
		this.startIndex = startIndex;

		this.modalTitle = `Adding ${soundData.length} sounds`;
		return this.isSaved ? this.parentUuid : null; // This is set on save.
	}

	// eslint-disable-next-line class-methods-use-this
	protected canCloseWithKey(): boolean {
		return true;
	}

	getContent(): HTMLElement[] {
		this.moveToggler = new Toggler("Move sounds", new InfoBalloon(
			"The sound files will be moved to the location defined in Settings.", "top"));
		return [this.moveToggler];
	}

	getFooterButtons(): HTMLButtonElement[] {
		const buttons = [
			Modal.getButton("close", () => { this.close(); }),
			Modal.getButton("add", () => { void this.save(); })
		];

		return buttons;
	}

	private async save(): Promise<void> {
		if (!this.sounds) throw Error("Calling openForAdd is required.");
		this.parentUuid = await window.actions.addSounds(this.sounds, this.parentUuid, this.moveToggler.isOn, this.startIndex);
		this._isSaved = true;
		this.close();
	}
}

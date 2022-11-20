import { FileSelector, KeyRecorder, Slider, TextField } from "../elements";
import { Modal } from "../modals";
import { Event, ExposedEvent } from "../../shared/events";
import { Soundboard } from "../../shared/models";

export default class SoundboardModal extends Modal {
    private nameElement!: TextField;
    private keysElement!: KeyRecorder;
    private volumeElement!: Slider;
    private folderElement!: FileSelector;
    private okButton!: HTMLButtonElement;
    private removeButton!: HTMLButtonElement;

    private loadedSoundboard: Soundboard;
    private isNew: boolean;

    public get onSaved(): ExposedEvent<Soundboard> { return this._onSaved.expose(); }
    private readonly _onSaved = new Event<Soundboard>();

    public get onRemove(): ExposedEvent<Soundboard> { return this._onRemove.expose(); }
    private readonly _onRemove = new Event<Soundboard>();

    constructor(soundboard: Soundboard, isNew: boolean) {
        super(false);
        this.loadedSoundboard = soundboard;
        this.isNew = isNew;
        this.modalTitle = isNew ? "Add Soundboard" : "Edit Soundboard";
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
        this.nameElement.value = this.loadedSoundboard.name;
        this.keysElement.keys = this.loadedSoundboard.keys;
        this.volumeElement.value = this.loadedSoundboard.volume;
        if (this.loadedSoundboard.linkedFolder) this.folderElement.value = this.loadedSoundboard.linkedFolder;

        const displaysFolderField = this.loadedSoundboard.linkedFolder || this.loadedSoundboard.sounds.length <= 0;
        this.folderElement.style.display = displaysFolderField ? "" : "none";

        this.okButton.innerHTML = this.isNew ? "Add" : "Save";
    }

    private async validate(): Promise<boolean> {
        let valid = true;
        if (!this.nameElement.value || !this.nameElement.value.trim()) {
            this.nameElement.warn();
            valid = false;
        }

        const isPathValid = await window.actions.isPathValid(this.folderElement.value, "folder");
        if (this.folderElement.value && !isPathValid) {
            this.folderElement.warn();
            valid = false;
        }

        return valid;
    }

    private async save(): Promise<void> {
        if (! await this.validate()) return;

        this.loadedSoundboard.name = this.nameElement.value;
        this.loadedSoundboard.keys = this.keysElement.keys;
        this.loadedSoundboard.volume = this.volumeElement.value;
        if (this.folderElement.value) this.loadedSoundboard.linkedFolder = this.folderElement.value;
        this._onSaved.raise(this.loadedSoundboard);

        this.close();
    }

    private removeSoundboard(): void {
        this._onRemove.raise(this.loadedSoundboard);
        this.close();
    }
}

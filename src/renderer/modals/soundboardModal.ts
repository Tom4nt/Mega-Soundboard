import { FileSelector, KeyRecorder, Slider, TextField } from "../elements";
import { Modal } from "../modals";
import { Event, ExposedEvent } from "../../shared/events";
import { Soundboard } from "../../shared/models";

export default class SoundboardModal extends Modal {
    private nameElement!: TextField;
    private keysElement!: KeyRecorder;
    private volumeElement!: Slider;
    private folderElement!: FileSelector;

    public get onSaved(): ExposedEvent<Soundboard> { return this._onSaved.expose(); }
    private readonly _onSaved = new Event<Soundboard>();

    public get onRemove(): ExposedEvent<Soundboard> { return this._onRemove.expose(); }
    private readonly _onRemove = new Event<Soundboard>();

    constructor(private readonly loadedSoundboard?: Soundboard) {
        super(false);
        this.modalTitle = loadedSoundboard ? "Edit Soundboard" : "Add Soundboard";
    }

    protected getContent(): HTMLElement {
        this.nameElement = new TextField("Name");
        this.keysElement = new KeyRecorder();
        this.volumeElement = new Slider("Volume");
        this.folderElement = new FileSelector("Linked Folder (Optional)", "folder");

        this.folderElement.onValueChanged.addHandler(() => {
            // TODO: Send to the main process to get a name from the path
            // if (!this.nameElement.value) this.nameElement.value = Utils.getFileNameNoExtension(this.folderElement.value);
        });

        if (this.loadedSoundboard) {
            this.nameElement.value = this.loadedSoundboard.name;
            this.keysElement.keys = this.loadedSoundboard.keys;
            this.volumeElement.value = this.loadedSoundboard.volume;
            if (this.loadedSoundboard.linkedFolder) this.folderElement.value = this.loadedSoundboard.linkedFolder;
        }

        const container = document.createElement("div");
        container.append(
            this.nameElement,
            this.folderElement,
            this.volumeElement,
            Modal.getLabel("Set Active"),
            this.keysElement,
        );

        if (this.loadedSoundboard && !this.loadedSoundboard.linkedFolder && this.loadedSoundboard.sounds.length >= 1) {
            this.folderElement.style.display = "none";
        }

        return container;
    }

    protected getFooterButtons(): HTMLButtonElement[] {
        let buttonName = "add";
        if (this.loadedSoundboard)
            buttonName = "save";

        const buttons = [
            Modal.getButton("close", () => { super.close(); }),
            Modal.getButton(buttonName, () => { void this.save(); })
        ];

        if (this.loadedSoundboard)
            buttons.unshift(Modal.getButton("remove", () => { this.removeSoundboard(); }, true, true));

        return buttons;
    }

    protected canCloseWithKey(): boolean {
        return !this.keysElement.isRecording;
    }

    private async validate(): Promise<boolean> {
        let valid = true;
        if (!this.nameElement.value || !this.nameElement.value.trim()) {
            this.nameElement.warn();
            valid = false;
        }

        const isPathValid = await window.functions.isPathValid(this.folderElement.value, "soundboard");
        if (this.folderElement.value && !isPathValid) {
            this.folderElement.warn();
            valid = false;
        }

        return valid;
    }

    private async save(): Promise<void> {
        if (! await this.validate()) return;

        if (!this.loadedSoundboard) {
            const uuid = await window.functions.getNewUUID();
            const soundboard = new Soundboard(uuid, this.nameElement.value, this.keysElement.keys, this.volumeElement.value, this.folderElement.value, []);
            this._onSaved.raise(soundboard);

        } else {
            this.loadedSoundboard.name = this.nameElement.value;
            this.loadedSoundboard.keys = this.keysElement.keys;
            this.loadedSoundboard.volume = this.volumeElement.value;
            if (this.folderElement.value) this.loadedSoundboard.linkedFolder = this.folderElement.value;
            this._onSaved.raise(this.loadedSoundboard);
        }
        this.close();
    }

    private removeSoundboard(): void {
        if (!this.loadedSoundboard) return;
        this._onRemove.raise(this.loadedSoundboard);
        this.close();
    }
}
import { FileSelector, InfoBalloon, KeyRecorder, Slider, TextField, Toggler } from "../elements";
import { Modal } from "../modals";
import { Sound } from "../../shared/models";
import { Event, ExposedEvent } from "../../shared/events";

type SaveEventArgs = { sound: Sound, moveRequested: boolean }

export default class SoundModal extends Modal {
    private nameElement!: TextField;
    private moveElement!: Toggler;
    private pathElement!: FileSelector;
    private volumeElement!: Slider;
    private keysElement!: KeyRecorder;
    private okButton!: HTMLButtonElement;
    private removeButton!: HTMLButtonElement;

    private loadedSound: Sound;
    private isNew: boolean;

    public get onSave(): ExposedEvent<SaveEventArgs> { return this._onSave.expose(); }
    private readonly _onSave = new Event<SaveEventArgs>();

    public get onRemove(): ExposedEvent<Sound> { return this._onRemove.expose(); }
    private readonly _onRemove = new Event<Sound>();

    constructor(sound: Sound, isNew: boolean) {
        super(false);
        this.loadedSound = sound;
        this.isNew = isNew;
        this.modalTitle = isNew ? "Add Sound" : "Edit Sound";
    }

    protected canCloseWithKey(): boolean {
        return !this.keysElement.isRecording;
    }

    protected connectedCallback(): void {
        this.update();
    }

    protected getContent(): HTMLElement[] {
        this.nameElement = new TextField("Name");
        this.moveElement = new Toggler("Move sound", new InfoBalloon("The sound file will be moved to the location defined in Settings.", "top"));
        this.pathElement = new FileSelector("Path", "sound");
        this.volumeElement = new Slider("Volume");
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
        this.nameElement.value = this.loadedSound.name;
        this.pathElement.value = this.loadedSound.path;
        this.volumeElement.value = this.loadedSound.volume;
        this.keysElement.keys = this.loadedSound.keys;

        const isLinked = this.loadedSound.soundboard?.linkedFolder;
        this.moveElement.style.display = this.isNew ? "" : "none"; // Can only move when it's a new sound
        this.pathElement.style.display = !isLinked ? "" : "none"; // Can only set the path for sounds in unlinked soundboards
        this.removeButton.style.visibility = this.isNew || isLinked ? "none" : "";

        this.okButton.innerHTML = this.isNew ? "Add" : "Save";
    }

    private async validate(): Promise<boolean> {
        let valid = true;
        if (!this.nameElement.value || !this.nameElement.value.trim()) {
            this.nameElement.warn();
            valid = false;
        }

        if (!this.pathElement.value || !this.pathElement.value.trim()) {
            this.pathElement.warn();
            valid = false;
        }

        if (valid) {
            if (! await window.actions.isPathValid(this.pathElement.value, "sound")) {
                valid = false;
                this.pathElement.warn();
            }
        }

        return valid;
    }

    private async save(): Promise<void> {
        if (! await this.validate()) return;

        this.loadedSound.name = this.nameElement.value;
        this.loadedSound.path = this.pathElement.value;
        this.loadedSound.volume = this.volumeElement.value;
        this.loadedSound.keys = this.keysElement.keys;

        this._onSave.raise({ sound: this.loadedSound, moveRequested: this.moveElement.isOn });
        this.close();
    }

    private removeSound(): void {
        this._onRemove.raise(this.loadedSound);
        this.close();
    }
}

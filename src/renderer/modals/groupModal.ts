import { Dropdown, KeyRecorder, Slider, TextField } from "../elements";
import { Modal } from "../modals";
import { Event, ExposedEvent } from "../../shared/events";
import { GroupMode, IGroupData } from "../../shared/models/data";
import { DropDownItem } from "../elements/dropdown";

type SaveEventArgs = { group: IGroupData }

export default class GroupModal extends Modal {
    private nameElement!: TextField;
    private modeElement!: Dropdown;
    private volumeElement!: Slider;
    private keysElement!: KeyRecorder;
    private okButton!: HTMLButtonElement;
    private removeButton!: HTMLButtonElement;
    private ungroupButton!: HTMLButtonElement;

    public get onSave(): ExposedEvent<SaveEventArgs> { return this._onSave.expose(); }
    private readonly _onSave = new Event<SaveEventArgs>();

    public get onRemove(): ExposedEvent<string> { return this._onRemove.expose(); }
    private readonly _onRemove = new Event<string>();

    constructor(
        private readonly loadedGroup: IGroupData,
        private readonly isInLinkedSoundboard: boolean,
    ) {
        super(false);
        this.modalTitle = "Edit Group";
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
        this.volumeElement = new Slider("Volume");
        this.keysElement = new KeyRecorder();

        this.modeElement.addItems(
            new DropDownItem("Random", "random" as GroupMode),
            new DropDownItem("Sequence", "sequence" as GroupMode),
            new DropDownItem("First", "first" as GroupMode),
        );

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

        if (!this.modeElement.selectedIndex) {
            // TODO: Warn
            valid = false;
        }

        return valid;
    }

    private async save(): Promise<void> {
        if (!await this.validate()) return;

        this.loadedGroup.name = this.nameElement.value;
        this.loadedGroup.mode = this.modeElement.selectedItem?.value as GroupMode;
        this.loadedGroup.volume = this.volumeElement.value;
        this.loadedGroup.keys = this.keysElement.keys;

        this._onSave.raise({ group: this.loadedGroup });
        this.close();
    }

    private removeGroup(): void {
        this._onRemove.raise(this.loadedGroup.uuid);
        this.close();
    }

    private ungroup(): void {
        // TODO
        this.close();
    }
}

import { KeyRecorder, Toggler, FileSelector } from "../elements";
import { Modal } from "../modals";

export default class SettingsModal extends Modal {
    private soundsLocationFileSelector!: FileSelector;
    private keybindsStateRecorder!: KeyRecorder;
    private stopSoundsRecorder!: KeyRecorder;
    private minimizeToTrayToggler!: Toggler;

    constructor() {
        super(false);
        this.modalTitle = "Settings";
    }

    protected getContent(): HTMLElement {
        this.stopSoundsRecorder = new KeyRecorder();
        this.keybindsStateRecorder = new KeyRecorder();
        this.soundsLocationFileSelector = new FileSelector("", "folder");
        this.minimizeToTrayToggler = new Toggler("Minimize to tray");

        void this.load();

        const container = document.createElement("div");
        container.append(
            Modal.getLabel("Stop all Sounds"),
            this.stopSoundsRecorder,
            Modal.getLabel("Enable/Disable keybinds"),
            this.keybindsStateRecorder,
            this.minimizeToTrayToggler,
            Modal.getLabel("Moved Sounds Location"),
            this.soundsLocationFileSelector
        );

        return container;
    }

    private async load(): Promise<void> {
        const settings = await window.functions.getSettings();

        this.stopSoundsRecorder.keys = settings.stopSoundsKeys;
        this.keybindsStateRecorder.keys = settings.enableKeybindsKeys;
        this.minimizeToTrayToggler.isOn = settings.minToTray;
        this.soundsLocationFileSelector.value = settings.soundsLocation ?? "";
    }

    protected getFooterButtons(): HTMLButtonElement[] {
        const buttons = [
            Modal.getButton("Close", () => { this.close(); }),
            Modal.getButton("Save", () => { void this.save(); }),
        ];
        return buttons;
    }

    protected canCloseWithKey(): boolean {
        return !this.stopSoundsRecorder.isRecording && !this.keybindsStateRecorder.isRecording;
    }

    private async validate(): Promise<boolean> {
        return await window.functions.isPathValid(this.soundsLocationFileSelector.value, "folder");
    }

    private async save(): Promise<void> {
        if (!await this.validate()) return;
        window.actions.saveSettings({
            enableKeybindsKeys: this.keybindsStateRecorder.keys,
            stopSoundsKeys: this.stopSoundsRecorder.keys,
            soundsLocation: this.soundsLocationFileSelector.value,
            minToTray: this.minimizeToTrayToggler.isOn,
        });
        this.close();
    }
}

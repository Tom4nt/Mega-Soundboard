import { KeyRecorder, Toggler, FileSelector } from "../elements";
import { Modal } from "../modals";

export default class SettingsModal extends Modal {
    private soundsLocationFileSelector!: FileSelector;
    private keybindsStateRecorder!: KeyRecorder;
    private stopSoundsRecorder!: KeyRecorder;
    private minimizeToTrayToggler!: Toggler;

    // TODO: Add Save button. Send save event to main process (it will register keybinds)
    constructor() {
        super(false);
        this.modalTitle = "Settings";
    }

    protected getContent(): HTMLElement {
        this.stopSoundsRecorder = new KeyRecorder();
        this.keybindsStateRecorder = new KeyRecorder();
        this.soundsLocationFileSelector = new FileSelector("", "folder");
        this.minimizeToTrayToggler = new Toggler("Minimize to tray");

        // TODO: Get settins from preload and load them
        // stopSoundsRecorder.keys = MS.instance.settings.stopSoundsKeys;
        // keybindsStateRecorder.keys = MS.instance.settings.enableKeybindsKeys;
        // minimizeToTrayToggler.isOn = MS.instance.settings.minToTray;
        // soundsLocationFileSelector.value = MS.instance.settings.getSoundsLocation();

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

    protected getFooterButtons(): HTMLButtonElement[] {
        const buttons = [
            Modal.getButton("Close", () => { this.close(); }),
        ];
        return buttons;
    }

    protected canCloseWithKey(): boolean {
        return !this.stopSoundsRecorder.isRecording && !this.keybindsStateRecorder.isRecording;
    }

    close(): void {
        super.close();
        void this.save();
    }

    validate(): boolean {
        return true; // TODO: Check if sound path is valid. (Via preload)
    }

    private save(): void {
        if (!this.validate()) return;
        // TODO: Save in the main process.
    }
}
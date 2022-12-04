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

    protected getContent(): HTMLElement[] {
        this.stopSoundsRecorder = new KeyRecorder();
        this.keybindsStateRecorder = new KeyRecorder();
        this.soundsLocationFileSelector = new FileSelector("", "folder");
        this.minimizeToTrayToggler = new Toggler("Minimize to tray");

        void this.load();

        return [
            Modal.getLabel("Stop all Sounds"),
            this.stopSoundsRecorder,
            Modal.getLabel("Enable/Disable keybinds"),
            this.keybindsStateRecorder,
            this.minimizeToTrayToggler,
            Modal.getLabel("Moved Sounds Location"),
            this.soundsLocationFileSelector
        ];
    }

    private async load(): Promise<void> {
        const settings = await window.actions.getSettings();

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
        const soundsPath = this.soundsLocationFileSelector.value;
        const pathValid = await window.actions.isPathValid(soundsPath, "folder");
        if (!soundsPath || pathValid)
            return true;
        else {
            this.soundsLocationFileSelector.warn();
            return false;
        }
    }

    private async save(): Promise<void> {
        if (!await this.validate()) return;
        let soundsPath: string | null = this.soundsLocationFileSelector.value;
        if (!soundsPath) soundsPath = null;

        window.actions.saveSettings({
            enableKeybindsKeys: this.keybindsStateRecorder.keys,
            stopSoundsKeys: this.stopSoundsRecorder.keys,
            soundsLocation: soundsPath,
            minToTray: this.minimizeToTrayToggler.isOn,
        });
        this.close();
    }
}

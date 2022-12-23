import { KeyRecorder, Toggler, FileSelector } from "../elements";
import { Modal } from "../modals";

export default class SettingsModal extends Modal {
    private soundsLocationFileSelector!: FileSelector;
    private keybindsStateRecorder!: KeyRecorder;
    private stopSoundsRecorder!: KeyRecorder;
    private pttRecorder!: KeyRecorder;
    private minimizeToTrayToggler!: Toggler;

    constructor() {
        super(false);
        this.modalTitle = "Settings";
    }

    protected getContent(): HTMLElement[] {
        this.stopSoundsRecorder = new KeyRecorder();
        this.keybindsStateRecorder = new KeyRecorder();
        this.pttRecorder = new KeyRecorder();
        this.soundsLocationFileSelector = new FileSelector("", "folder");
        this.minimizeToTrayToggler = new Toggler("Minimize to tray");

        void this.load();

        return [
            Modal.getLabel("Stop all Sounds"),
            this.stopSoundsRecorder,
            Modal.getLabel("Enable/Disable keybinds"),
            this.keybindsStateRecorder,
            Modal.getLabel("PTT keys to press"),
            this.pttRecorder,
            this.minimizeToTrayToggler,
            Modal.getLabel("Moved Sounds Location"),
            this.soundsLocationFileSelector
        ];
    }

    private async load(): Promise<void> {
        const settings = await window.actions.getSettings();

        this.stopSoundsRecorder.keys = settings.stopSoundsKeys;
        this.keybindsStateRecorder.keys = settings.enableKeybindsKeys;
        this.pttRecorder.keys = settings.pttKeys;
        this.minimizeToTrayToggler.isOn = settings.minToTray;
        this.soundsLocationFileSelector.value = settings.soundsLocation ?? await window.actions.getDefaultMovePath();
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

    private async validate(finalSoundsPath: string | null): Promise<boolean> {
        if (!finalSoundsPath) {
            this.soundsLocationFileSelector.warn();
            return false;
        }
        return true;
    }

    private async save(): Promise<void> {
        const soundsPath = await window.actions.parsePath(this.soundsLocationFileSelector.value);
        if (! await this.validate(soundsPath)) return;

        window.actions.saveSettings({
            enableKeybindsKeys: this.keybindsStateRecorder.keys,
            stopSoundsKeys: this.stopSoundsRecorder.keys,
            soundsLocation: soundsPath,
            minToTray: this.minimizeToTrayToggler.isOn,
            pttKeys: this.pttRecorder.keys,
        });
        this.close();
    }
}

import { KeyRecorder, Toggler, FileSelector } from "../elements";
import { Modal } from "../modals";

export default class SettingsModal extends Modal {
    private soundsLocationFileSelector!: FileSelector;
    private keybindsStateRecorder!: KeyRecorder;
    private stopSoundsRecorder!: KeyRecorder;
    private randomSoundRecorder!: KeyRecorder;
    private pttRecorder!: KeyRecorder;
    private minimizeToTrayToggler!: Toggler;
    private processKeysOnReleaseToggler!: Toggler;

    constructor() {
        super(false);
        this.modalTitle = "Settings";
    }

    protected getContent(): HTMLElement[] {
        this.stopSoundsRecorder = new KeyRecorder();
        this.keybindsStateRecorder = new KeyRecorder();
        this.randomSoundRecorder = new KeyRecorder();
        this.pttRecorder = new KeyRecorder();
        this.soundsLocationFileSelector = new FileSelector("", "folder");
        this.minimizeToTrayToggler = new Toggler("Minimize to tray");
        this.processKeysOnReleaseToggler = new Toggler("Process keybinds only on key release");

        void this.load();

        return [
            Modal.getLabel("Stop all Sounds"),
            this.stopSoundsRecorder,
            Modal.getLabel("Enable/Disable keybinds"),
            this.keybindsStateRecorder,
            Modal.getLabel("Play random Sound"),
            this.randomSoundRecorder,
            Modal.getLabel("PTT keys to press"),
            this.pttRecorder,
            this.minimizeToTrayToggler,
            this.processKeysOnReleaseToggler,
            Modal.getLabel("Sound location"),
            this.soundsLocationFileSelector
        ];
    }

    private async load(): Promise<void> {
        const settings = await window.actions.getSettings();

        this.stopSoundsRecorder.keys = settings.stopSoundsKeys;
        this.keybindsStateRecorder.keys = settings.enableKeybindsKeys;
        this.randomSoundRecorder.keys = settings.randomSoundKeys;
        this.pttRecorder.keys = settings.pttKeys;
        this.minimizeToTrayToggler.isOn = settings.minToTray;
        this.soundsLocationFileSelector.value = settings.soundsLocation ?? await window.actions.getDefaultMovePath();
        this.processKeysOnReleaseToggler.isOn = settings.processKeysOnRelease;
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
            randomSoundKeys: this.randomSoundRecorder.keys,
            processKeysOnRelease: this.processKeysOnReleaseToggler.isOn,
        });
        this.close();
    }
}

import { KeyRecorder, Toggler, FileSelector } from "../elements";
import { Modal } from "../modals";
import { KeybindManager, MS } from "../../shared/models";

export default class SettingsModal extends Modal {
    private soundLocationElement!: FileSelector;

    constructor() {
        super(false);
        this.modalTitle = "Settings";
    }

    protected getContent(): HTMLElement {
        const stopSoundsRecorder = new KeyRecorder();
        const keybindsStateRecorder = new KeyRecorder();
        const minimizeToTrayToggler = new Toggler("Minimize to tray");
        const soundsLocationFileSelector = new FileSelector("", "folder");
        this.soundLocationElement = soundsLocationFileSelector;

        stopSoundsRecorder.keys = MS.instance.settings.stopSoundsKeys;
        keybindsStateRecorder.keys = MS.instance.settings.enableKeybindsKeys;
        minimizeToTrayToggler.isOn = MS.instance.settings.minToTray;
        soundsLocationFileSelector.value = MS.instance.settings.getSoundsLocation();

        stopSoundsRecorder.onStopRecording.addHandler(() => {
            void SettingsModal.registerStopSoundsKeybind(stopSoundsRecorder.keys);
        });

        stopSoundsRecorder.onClear.addHandler(() => {
            void SettingsModal.registerStopSoundsKeybind(stopSoundsRecorder.keys);
        });

        keybindsStateRecorder.onStopRecording.addHandler(() => {
            void SettingsModal.registerEnableKeybindsKeybind(keybindsStateRecorder.keys);
        });

        keybindsStateRecorder.onStartRecording.addHandler(() => {
            void SettingsModal.registerEnableKeybindsKeybind(keybindsStateRecorder.keys);
        });

        minimizeToTrayToggler.onToggle.addHandler(() => {
            MS.instance.setMinToTray(minimizeToTrayToggler.isOn);
        });

        const container = document.createElement("div");
        container.append(
            Modal.getLabel("Stop all Sounds"),
            stopSoundsRecorder,
            Modal.getLabel("Enable/Disable keybinds"),
            keybindsStateRecorder,
            minimizeToTrayToggler,
            Modal.getLabel("Moved Sounds Location"),
            soundsLocationFileSelector
        );

        return container;
    }

    protected getFooterButtons(): HTMLButtonElement[] {
        const buttons = [
            Modal.getButton("Close", () => { this.close(); }),
        ];
        return buttons;
    }

    close(): void {
        super.close();
        void this.save();
    }

    private static async registerStopSoundsKeybind(keybind: number[]): Promise<void> {
        MS.instance.settings.stopSoundsKeys = keybind;
        await MS.instance.settings.save();
        await KeybindManager.instance.registerAction(keybind, () => Promise.resolve(MS.instance.stopAllSounds()), "stop-sounds");
    }

    private static async registerEnableKeybindsKeybind(keybind: number[]): Promise<void> {
        MS.instance.settings.enableKeybindsKeys = keybind;
        await MS.instance.settings.save();
        await KeybindManager.instance.registerAction(keybind, () => Promise.resolve(MS.instance.toggleKeybindsState()), "toggle-keybinds-state");
    }

    private async save(): Promise<void> {
        if (await this.soundLocationElement.isPathValid()) {
            MS.instance.settings.soundsLocation = this.soundLocationElement.value;
        }
        await MS.instance.settings.save();
    }
}
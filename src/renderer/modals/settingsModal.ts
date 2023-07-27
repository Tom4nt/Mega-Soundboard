import { KeyRecorder, Toggler, FileSelector, Slider } from "../elements";
import { Modal } from "../modals";
import GlobalEvents from "../util/globalEvents";

export default class SettingsModal extends Modal {
    private soundsLocationFileSelector!: FileSelector;
    private keybindsStateRecorder!: KeyRecorder;
    private stopSoundsRecorder!: KeyRecorder;
    private randomSoundRecorder!: KeyRecorder;
    private pttRecorder!: KeyRecorder;
    private minimizeToTrayToggler!: Toggler;
    private processKeysOnReleaseToggler!: Toggler;
    private zoomSlider!: Slider;

    constructor() {
        super(false);
        this.modalTitle = "Settings";
    }

    protected override getContent(): HTMLElement[] {
        this.stopSoundsRecorder = new KeyRecorder();
        this.keybindsStateRecorder = new KeyRecorder();
        this.randomSoundRecorder = new KeyRecorder();
        this.pttRecorder = new KeyRecorder();
        this.soundsLocationFileSelector = new FileSelector("", "folder");
        this.minimizeToTrayToggler = new Toggler("Minimize to tray");
        this.processKeysOnReleaseToggler = new Toggler("Process keybinds only on key release");
        this.zoomSlider = new Slider("", "&times;");

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
            this.soundsLocationFileSelector,
            Modal.getLabel("Zoom factor"),
            this.zoomSlider,
            SettingsModal.getZoomLabel(),
        ];
    }

    private async load(): Promise<void> {
        const settings = await window.actions.getSettings();

        this.stopSoundsRecorder.keys = settings.stopSoundsKeys;
        this.keybindsStateRecorder.keys = settings.enableKeybindsKeys;
        this.randomSoundRecorder.keys = settings.randomSoundKeys;
        this.pttRecorder.keys = settings.pttKeys;
        this.minimizeToTrayToggler.isOn = settings.minToTray;
        this.soundsLocationFileSelector.value =
            settings.soundsLocation ? settings.soundsLocation : await window.actions.getDefaultMovePath();
        this.processKeysOnReleaseToggler.isOn = settings.processKeysOnRelease;

        this.zoomSlider.step = 0.1;
        this.zoomSlider.min = 0.2;
        this.zoomSlider.max = 2;
        this.zoomSlider.value = await window.actions.zoomGet();
        this.zoomSlider.onValueChange.addHandler(s => window.actions.zoomSet(s.value));
    }

    protected getFooterButtons(): HTMLButtonElement[] {
        const buttons = [
            Modal.getButton("Close", () => { this.close(); }),
            Modal.getButton("Save", () => { void this.save(); }),
        ];
        return buttons;
    }

    protected override connectedCallback(): void {
        super.connectedCallback();
        GlobalEvents.addHandler("onZoomFactorChanged", this.zoomFactorChangedHandler);
    }

    protected override disconnectedCallback(): void {
        super.disconnectedCallback();
        GlobalEvents.removeHandler("onZoomFactorChanged", this.zoomFactorChangedHandler);
    }

    private zoomFactorChangedHandler = (factor: number): void => {
        this.zoomSlider.value = factor;
    };

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
        if (! await this.validate(soundsPath) || soundsPath === null) return;

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

    private static getZoomLabel(): HTMLParagraphElement {
        // I hate the inline HTML, but it will be fixed with the redesign.
        const html = `
            Use <span class='key'>CTRL</span> <span class='key'>+</span>/<span class='key'>-</span>
            to zoom in/out. <span class='key'>CTRL</span> <span class='key'>0</span> to reset.
        `;
        const label = document.createElement("p");
        label.innerHTML = html;
        return label;
    }
}

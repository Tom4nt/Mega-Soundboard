import { ActionName, actions } from "../../shared/quickActions";
import { KeyRecorder, Toggler, FileSelector, Slider } from "../elements";
import { Modal } from "../modals";

export default class SettingsModal extends Modal {
    private soundsLocationFileSelector!: FileSelector;
    private pttRecorder!: KeyRecorder;
    private minimizeToTrayToggler!: Toggler;
    private processKeysOnReleaseToggler!: Toggler;
    private zoomSlider!: Slider;

    private quickActionRecorders: Map<ActionName, KeyRecorder> = new Map();

    constructor() {
        super(false);
        this.modalTitle = "Settings";
    }

    protected override getContent(): HTMLElement[] {
        this.pttRecorder = new KeyRecorder();
        this.soundsLocationFileSelector = new FileSelector("", "folder");
        this.minimizeToTrayToggler = new Toggler("Minimize to tray");
        this.processKeysOnReleaseToggler = new Toggler("Process keybinds only on key release");
        this.zoomSlider = new Slider("", "&times;");

        void this.load();

        return [
            ...this.getQuickActionContent(),
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

    private getQuickActionContent(): HTMLElement[] {
        const elements: HTMLElement[] = [];
        let key: ActionName;
        for (key in actions) {
            const name = actions[key].name;
            elements.push(Modal.getLabel(name));
            const recorder = new KeyRecorder();
            elements.push(recorder);
            this.quickActionRecorders.set(key, recorder);
        }
        return elements;
    }

    private async load(): Promise<void> {
        const settings = await window.actions.getSettings();
        this.loadQuickActions(settings.quickActionKeys);

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

    private loadQuickActions(actionKeys: { [name: string]: number[] }): void {
        let key: ActionName;
        for (key in actions) {
            const recorder = this.quickActionRecorders.get(key);
            if (recorder && Object.keys(actionKeys).includes(key))
                recorder.keys = actionKeys[key]!;
        }
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
        window.events.onZoomFactorChanged.addHandler(this.zoomFactorChangedHandler);
    }

    protected override disconnectedCallback(): void {
        super.disconnectedCallback();
        window.events.onZoomFactorChanged.removeHandler(this.zoomFactorChangedHandler);
    }

    private zoomFactorChangedHandler = (factor: number): void => {
        this.zoomSlider.value = factor;
    };

    protected canCloseWithKey(): boolean {
        const anyQuickActionsRecording = Array.from(this.quickActionRecorders.values()).some(x => x.isRecording);
        const anyRecording = anyQuickActionsRecording || this.pttRecorder.isRecording;
        return !anyRecording;
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
            quickActionKeys: this.getQuickActionKeys(),
            soundsLocation: soundsPath,
            minToTray: this.minimizeToTrayToggler.isOn,
            pttKeys: this.pttRecorder.keys,
            processKeysOnRelease: this.processKeysOnReleaseToggler.isOn,
        });
        this.close();
    }

    private getQuickActionKeys(): { [name: string]: number[] } {
        const res: { [name: string]: number[] } = {};
        let key: ActionName;
        for (key in actions) {
            const recorder = this.quickActionRecorders.get(key);
            if (!recorder) continue;

            if (recorder.keys.length === 0) delete res[key];
            else res[key] = recorder.keys;
        }
        return res;
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

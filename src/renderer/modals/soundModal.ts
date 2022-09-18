import { FileSelector, InfoBalloon, KeyRecorder, Slider, TextField, Toggler } from "../elements";
import { Modal } from "../modals";
import { Sound } from "../../shared/models";
import { Event, ExposedEvent } from "../../shared/events";

export default class SoundModal extends Modal {
    private nameElement!: TextField;
    private moveElement!: Toggler;
    private pathElement!: FileSelector;
    private volumeElement!: Slider;
    private keysElement!: KeyRecorder;
    private okButton!: HTMLButtonElement;

    private loadedSound: Sound | null = null;

    public get onSave(): ExposedEvent<Sound> { return this._onSave.expose(); }
    private readonly _onSave = new Event<Sound>();

    public get onRemove(): ExposedEvent<Sound> { return this._onRemove.expose(); }
    private readonly _onRemove = new Event<Sound>();

    constructor(sound: Sound | null) {
        super(false);
        this.modalTitle = sound ? "Edit Sound" : "Add Sound";
        this.loadedSound = sound;
        // TODO: Hide and show elements according to loaded sound. Loaded: hide moveElement and check if sound is linked (remove pathElement).
        // TODO: Change ok button text after loading a sound or null.
        // TODO: Set "remove sound" visibility accorting to loaded sound (!isLinked).
    }

    protected canClose(): boolean {
        return !this.keysElement.isRecording;
    }

    getContent(): HTMLElement {
        this.nameElement = new TextField("Name");
        this.moveElement = new Toggler("Move sound", new InfoBalloon("The sound file will be moved to the location defined in Settings.", "top"));
        this.pathElement = new FileSelector("Path", "file", "Audio files", ["mp3", "wav", "ogg"]);
        this.volumeElement = new Slider("Volume");
        this.keysElement = new KeyRecorder();

        this.keysElement.onStartRecording.addHandler(() => this.canCloseWithKey = false);
        this.keysElement.onStopRecording.addHandler(() => this.canCloseWithKey = true);

        if (this.loadedSound) {
            this.nameElement.value = this.loadedSound.name;
            this.pathElement.value = this.loadedSound.path;
            this.volumeElement.value = this.loadedSound.volume;
            this.keysElement.keys = this.loadedSound.keys;
        }

        this.pathElement.onValueChanged.addHandler((v) => {
            // TODO
            // this.nameElement.value = Utils.getFileNameNoExtension(v);
        });

        const elems: HTMLElement[] = [
            this.nameElement,
            this.moveElement,
            this.pathElement,
            this.volumeElement,
            Modal.getLabel("Play"),
            this.keysElement,
        ];

        const contentDiv = new HTMLDivElement();
        contentDiv.append(...elems);
        return contentDiv;
    }

    getFooterButtons(): HTMLButtonElement[] {
        this.okButton = Modal.getButton("ok", () => { void this.soundAction(); }, false, false);

        const buttons = [
            Modal.getButton("remove", () => { this.removeSound(); }, true, true),
            Modal.getButton("close", () => { this.close(); }, false, false),
            this.okButton
        ];

        return buttons;
    }

    async soundAction(): Promise<void> {
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
            if (! await this.pathElement.isPathValid()) {
                valid = false;
                this.pathElement.warn();
            }
        }

        if (valid) {
            if (this.loadedSound) {
                this.loadedSound.name = this.nameElement.value;
                this.loadedSound.path = this.pathElement.value;
                this.loadedSound.volume = this.volumeElement.value;
                this.loadedSound.keys = this.keysElement.keys;
                // TODO: Call global sound edit function (main process). 
                // this.dispatchEvent(new CustomEvent("edit", { detail: { sound: this.sound } }));

            } else { // Add Sound. // TODO: Move to main process.
                // const file = this.pathElement.value;
                // const folder = p.dirname(file);
                // const targetFolder = MS.instance.settings.getSoundsLocation();
                if (this.moveElement.isOn /*&& p.resolve(folder) != p.resolve(targetFolder)*/) {
                    //     let targetFile = p.join(MS.instance.settings.getSoundsLocation(), p.basename(file));
                    const targetFile = "TODO";

                    //     try {
                    //         await fs.access(targetFolder, fsConstants.F_OK);
                    //     } catch (error) {
                    //         await fs.mkdir(targetFolder);
                    //     }

                    //     let i = 2;
                    //     const ext = p.extname(targetFile);
                    //     while (await Utils.pathExists(targetFile)) {
                    //         targetFile = `${targetFile.slice(0, -ext.length)} (${i})${ext}`;
                    //         i++;
                    //     }

                    //     try {
                    //         await fs.copyFile(file, targetFile);
                    //     } catch (error) {
                    //         console.log(error);
                    //     }

                    //     await fs.unlink(file);
                    const sound = new Sound(this.nameElement.value, targetFile, this.volumeElement.value, this.keysElement.keys);
                    this._onSave.raise(sound);

                } else {
                    const sound = new Sound(this.nameElement.value, this.pathElement.value, this.volumeElement.value, this.keysElement.keys);
                    this._onSave.raise(sound);
                }
            }
            this.close();
        }
    }

    removeSound(): void {
        // TODO: Call appropriate function in the main process.
        if (this.loadedSound) this._onRemove.raise(this.loadedSound);
        this.close();
    }
}

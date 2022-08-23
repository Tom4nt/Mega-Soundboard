import { FileSelector, InfoBalloon, KeyRecorder, Slider, TextField, Toggler } from "../../Elements";
import { MS, Sound, Utils } from "../../Models";
import { Modal } from "../Modals";
import * as p from "path";
import { promises as fs, constants as fsConstants } from "fs";

export default class SoundModal extends Modal {
    private nameElement: TextField | null = null;
    private moveElement: Toggler | null = null;
    private pathElement: FileSelector | null = null;
    private volumeElement: Slider | null = null;
    private keysElement: KeyRecorder | null = null;
    private okButton: HTMLButtonElement | null = null;

    private loadedSound: Sound | null = null;

    constructor() {
        super(false);
    }

    loadSound(sound: Sound | null): void {
        this.title = sound ? "Edit Sound" : "Add Sound";
        this.loadedSound = sound;
        // TODO: Hide and show elements according to loaded sound. Loaded: hide moveElement and check if sound is linked (remove pathElement).
        // TODO: Change ok button text after loading a sound or null.
        // TODO: Set remove sound visibility accorting to loaded sound (!isLinked).
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
            if (!this.nameElement) return;
            this.nameElement.value = Utils.getFileNameNoExtension(v);
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
        if (!this.nameElement ||
            !this.pathElement ||
            !this.volumeElement ||
            !this.keysElement ||
            !this.moveElement) return;

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
                const file = this.pathElement?.value;
                const folder = p.dirname(file);
                const targetFolder = MS.instance.settings.getSoundsLocation();
                if (this.moveElement.isOn && p.resolve(folder) != p.resolve(targetFolder)) {
                    let targetFile = p.join(MS.instance.settings.getSoundsLocation(), p.basename(file));

                    try {
                        await fs.access(targetFolder, fsConstants.F_OK);
                    } catch (error) {
                        await fs.mkdir(targetFolder);
                    }

                    let i = 2;
                    const ext = p.extname(targetFile);
                    while (await Utils.fileExists(targetFile)) {
                        targetFile = p.basename(`${targetFile}(${i})`, ext);
                        i++;
                    }

                    try {
                        await fs.copyFile(file, targetFile);
                    } catch (error) {
                        console.log(error);
                    }

                    await fs.unlink(file);
                    // new Sound(this.nameElement.value, targetFile, this.volumeElement.value, this.keysElement.keys);
                    // this.dispatchEvent(new CustomEvent("add", { detail: { sound: sound } }));

                } else {
                    // new Sound(this.nameElement.value, this.pathElement.value, this.volumeElement.value, this.keysElement.keys);
                    // this.dispatchEvent(new CustomEvent("add", { detail: { sound: sound } }));
                }
            }
            this.close();
        }
    }

    removeSound(): void {
        // TODO: Call appropriate function in the main process.
        // this.dispatchEvent(new CustomEvent("remove", { detail: { sound: this.sound } }));
        this.close();
    }
}

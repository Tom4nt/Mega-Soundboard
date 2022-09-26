import { InfoBalloon, Toggler } from "../elements";
import { Modal } from "../modals";
import { Sound } from "../../shared/models";
import { Event, ExposedEvent } from "../../shared/events";

export default class MultiSoundModal extends Modal {
    private sounds: Sound[] = [];
    private moveToggler!: Toggler;

    get onAdded(): ExposedEvent<Sound[]> { return this._onAdded.expose(); }
    private readonly _onAdded = new Event<Sound[]>();

    constructor(private count: number) {
        super(false);
        this.sounds = [];
        this.modalTitle = `Adding ${count} sounds`;
    }

    // eslint-disable-next-line class-methods-use-this
    protected canClose(): boolean {
        return true;
    }

    getContent(): HTMLElement {
        this.moveToggler = new Toggler("Move sounds", new InfoBalloon("The sound files will be moved to the location defined in Settings.", "top"));

        const body = document.createElement("div");
        body.append(this.moveToggler);
        return body;
    }

    getFooterButtons(): HTMLButtonElement[] {
        const buttons = [
            Modal.getButton("close", () => { this.close(); }),
            Modal.getButton("add", () => { void this.okAction(); })
        ];

        return buttons;
    }

    okAction(): void {
        // const moveFolder = MS.instance.settings.getSoundsLocation();

        // TODO: Isolate I/O logic
        // for (let i = 0; i < this.paths.length; i++) {
        //     const file = this.paths[i];
        //     const folder = p.dirname(file);
        //     const soundName = p.basename(file, p.extname(file));

        //     if (this.moveToggler.isOn && p.resolve(folder) != p.resolve(moveFolder)) {
        //         let moveFile = MS.instance.settings.getSoundsLocation() + "\\" + p.basename(file);

        //         const folderExists = await Utils.pathExists(moveFolder);
        //         if (!folderExists) await fs.mkdir(moveFolder);

        //         let i = 2;
        //         const ext = p.extname(moveFile);
        //         while (await Utils.pathExists(moveFile)) {
        //             moveFile = `${moveFile.removeExtension()} (${i})${ext}`;
        //             i++;
        //         }

        //         try {
        //             await fs.copyFile(file, moveFile);
        //             await fs.unlink(file);
        //         } catch (error) {
        //             console.log(error);
        //             this.paths.splice(i, 1);
        //             i--;
        //         }

        //         const sound = new Sound(soundName, moveFile, 100, []);
        //         this.sounds.push(sound);

        //     } else {
        //         const sound = new Sound(soundName, file, 100, []);
        //         this.sounds.push(sound);
        //     }
        // }

        this._onAdded.raise(this.sounds);
        this.close();
    }
}

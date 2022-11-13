import { InfoBalloon, Toggler } from "../elements";
import { Modal } from "../modals";
import { Event, ExposedEvent } from "../../shared/events";

type AddedEventArgs = { moveRequested: boolean };

export default class MultiSoundModal extends Modal {
    private moveToggler!: Toggler;

    get onConfirmed(): ExposedEvent<AddedEventArgs> { return this._onConfirmed.expose(); }
    private readonly _onConfirmed = new Event<AddedEventArgs>();

    constructor(private count: number) {
        super(false);
        this.modalTitle = `Adding ${count} sounds`;
    }

    // eslint-disable-next-line class-methods-use-this
    protected canCloseWithKey(): boolean {
        return true;
    }

    getContent(): HTMLElement[] {
        this.moveToggler = new Toggler("Move sounds", new InfoBalloon(
            "The sound files will be moved to the location defined in Settings.", "top"));
        return [this.moveToggler];
    }

    getFooterButtons(): HTMLButtonElement[] {
        const buttons = [
            Modal.getButton("close", () => { this.close(); }),
            Modal.getButton("add", () => { void this.save(); })
        ];

        return buttons;
    }

    save(): void {
        this._onConfirmed.raise({ moveRequested: this.moveToggler.isOn });
        this.close();
    }
}

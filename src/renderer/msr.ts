import AudioManager from "./audioManager";
import ModalManager from "./modalManager";

/** MegaSoundboardRenderer - Represents an instance of the main renderer process. */
export default class MSR {
    public static readonly instance: MSR = new MSR();

    readonly audioManager: AudioManager;
    readonly modalManager: ModalManager;

    constructor() {
        this.audioManager = new AudioManager();
        this.modalManager = new ModalManager();
    }
}
import { Settings } from "../shared/models";
import AudioManager from "./audioManager";
import ModalManager from "./modalManager";
import GlobalEvents from "./util/globalEvents";

/** MegaSoundboardRenderer - Represents an instance of the main renderer process. */
export default class MSR {
    private static _instance = new MSR(window.getInitialContent().settings);
    public static get instance(): MSR { return this._instance; }

    readonly audioManager: AudioManager;
    readonly modalManager: ModalManager;

    private constructor(settings: Settings) {
        GlobalEvents.registerEvents();
        this.modalManager = new ModalManager();
        this.audioManager = new AudioManager(settings);
        MSR._instance = this;
    }
}

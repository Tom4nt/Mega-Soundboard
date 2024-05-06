import AudioPlayer from "./audioPlayer";
import ModalManager from "./modalManager";
import GlobalEvents from "./util/globalEvents";

/** MegaSoundboardRenderer - Represents an instance of the main renderer process. */
export default class MSR {
	private static _instance = new MSR();
	public static get instance(): MSR { return this._instance; }

	readonly modalManager: ModalManager;
	readonly audioPlayer: AudioPlayer;

	private constructor() {
		GlobalEvents.registerEvents();
		this.modalManager = new ModalManager();
		this.audioPlayer = new AudioPlayer();
		MSR._instance = this;
	}
}

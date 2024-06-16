import AudioPlayer from "./audioPlayer";
import DraggableManager from "./draggableManager";
import ModalManager from "./modalManager";
import GlobalEvents from "./util/globalEvents";

/** MegaSoundboardRenderer - Represents an instance of the main renderer process. */
export default class MSR {
	private static _instance = new MSR();
	public static get instance(): MSR { return this._instance; }

	readonly modalManager: ModalManager;
	readonly audioPlayer: AudioPlayer;
	readonly draggableManager: DraggableManager;

	private constructor() {
		GlobalEvents.registerEvents();
		this.modalManager = new ModalManager();
		this.audioPlayer = new AudioPlayer();
		this.draggableManager = new DraggableManager();
		MSR._instance = this;
	}
}

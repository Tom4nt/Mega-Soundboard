import Modal from "./modals/modal";
import MSModal from "./modals/msModal";
import NewsModal from "./modals/newsModal";
import SoundModal from "./modals/soundModal";
import MessageModal from "./modals/messageModal";
import SoundboardModal from "./modals/soundboardModal";
import MultiSoundModal from "./modals/multiSoundModal";
import SettingsModal from "./modals/settingsModal";
import GroupModal from "./modals/groupModal";

export {
	Modal,
	SoundModal,
	NewsModal,
	MSModal,
	MessageModal,
	SoundboardModal,
	MultiSoundModal,
	SettingsModal,
	GroupModal,
};

customElements.define("ms-msmodal", MSModal);
customElements.define("ms-newsmodal", NewsModal);
customElements.define("ms-soundmodal", SoundModal);
customElements.define("ms-groupmodal", GroupModal);
customElements.define("ms-messagemodal", MessageModal);
customElements.define("ms-soundboardmodal", SoundboardModal);
customElements.define("ms-multisoundmodal", MultiSoundModal);
customElements.define("ms-settingsmodal", SettingsModal);

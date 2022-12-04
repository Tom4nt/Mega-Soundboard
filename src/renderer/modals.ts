import Modal from "./modals/modal";
import MSModal from "./modals/msModal";
import NewsModal from "./modals/newsModal";
import SoundModal from "./modals/soundModal";
import MessageModal from "./modals/messageModal";
import SoundboardModal from "./modals/soundboardModal";
import MultiSoundModal from "./modals/multiSoundModal";
import SettingsModal from "./modals/settingsModal";

export {
    Modal,
    SoundModal,
    NewsModal,
    MSModal,
    MessageModal,
    SoundboardModal,
    MultiSoundModal,
    SettingsModal,
};

export class DefaultModals {
    static errSoundboardIsLinked(path: string): MessageModal {
        const folder = `<a href="${path}">folder</a>`;
        const modal = new MessageModal("Linked Soundboard",
            `This soundboard is linked to a ${folder}. Add sounds to the folder and they will appear here automatically.`,
            false);
        return modal;
    }
}

customElements.define("ms-msmodal", MSModal);
customElements.define("ms-newsmodal", NewsModal);
customElements.define("ms-soundmodal", SoundModal);
customElements.define("ms-messagemodal", MessageModal);
customElements.define("ms-soundboardmodal", SoundboardModal);
customElements.define("ms-multisoundmodal", MultiSoundModal);
customElements.define("ms-settingsmodal", SettingsModal);

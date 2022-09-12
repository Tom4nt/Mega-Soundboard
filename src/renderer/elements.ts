import KeyRecorder from "./elements/keyRecorder";
import Slider from "./elements/slider";
import SoundItem from "./elements/soundItem";
import SoundList from "./elements/soundList";
import Titlebar from "./elements/titlebar";
import Toggler from "./elements/toggler";
import TextField from "./elements/textField";
import InfoBalloon from "./elements/infoBalloon";
import FileSelector from "./elements/fileSelector";
import SoundboardItem from "./elements/soundboardItem";
import SoundboardList from "./elements/soundboardList";
import Dropdown from "./elements/dropdown";

export {
    KeyRecorder,
    Slider,
    SoundItem,
    Toggler,
    Titlebar,
    SoundList,
    TextField,
    InfoBalloon,
    FileSelector,
    SoundboardItem,
    SoundboardList,
    Dropdown
};

customElements.define("ms-slider", Slider);
customElements.define("ms-titlebar", Titlebar);
customElements.define("ms-keyrecorder", KeyRecorder);
customElements.define("ms-toggler", Toggler);
customElements.define("ms-soundlist", SoundList);
customElements.define("ms-soundboardlist", SoundboardList);
customElements.define("ms-sound", SoundItem);
customElements.define("ms-dropdown", Dropdown);

// TODO: Define all
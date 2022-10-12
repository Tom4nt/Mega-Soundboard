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
import Tooltip from "./elements/tooltip";
import SearchBox from "./elements/searchBox";
import IconButton from "./elements/iconButton";

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
    Dropdown,
    Tooltip,
    SearchBox,
    IconButton,
};

customElements.define("ms-dropdown", Dropdown);
customElements.define("ms-fileselector", FileSelector);
customElements.define("ms-iconbutton", IconButton);
customElements.define("ms-infoballoon", InfoBalloon);
customElements.define("ms-keyrecorder", KeyRecorder);
customElements.define("ms-searchbox", SearchBox);
customElements.define("ms-slider", Slider);
customElements.define("ms-soundboard", SoundboardItem);
customElements.define("ms-soundboardlist", SoundboardList);
customElements.define("ms-sound", SoundItem);
customElements.define("ms-soundlist", SoundList);
customElements.define("ms-textfield", TextField);
customElements.define("ms-titlebar", Titlebar);
customElements.define("ms-toggler", Toggler);
customElements.define("ms-tooltip", Tooltip);
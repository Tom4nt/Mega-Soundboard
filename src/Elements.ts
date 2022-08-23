import * as Modals from "./elements/Modals";
import KeyRecorder from "./elements/KeyRecorder";
import Slider from "./elements/Slider";
import Sound from "./elements/Sound";
import SoundList from "./elements/SoundList";
import Titlebar from "./elements/Titlebar";
import Toggler from "./elements/Toggler";
import TooltipElement from "./elements/TooltipElement";
import TextField from "./elements/TextField";
import InfoBalloon from "./elements/InfoBalloon";
import FileSelector from "./elements/FileSelector";
import Soundboard from "./elements/Soundboard";
import * as DropdownElements from "./elements/DropdownElements";

export {
    Modals,
    KeyRecorder,
    Slider,
    Sound,
    Toggler,
    Titlebar,
    TooltipElement,
    SoundList,
    TextField,
    InfoBalloon,
    FileSelector,
    Soundboard,
    DropdownElements,
};

customElements.define("ms-slider", Slider);
customElements.define("ms-titlebar", Titlebar);
customElements.define("ms-keyrecorder", KeyRecorder);
customElements.define("ms-toggler", Toggler);
customElements.define("ms-soundlist", SoundList);
customElements.define("ms-sound", Sound);
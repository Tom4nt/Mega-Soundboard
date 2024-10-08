import KeyRecorder from "./elements/keyRecorder";
import Slider from "./elements/slider";
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
import Seekbar from "./elements/seekbar";
import MessageHost from "./elements/messageHost";
import Draggable from "./elements/draggable";
import FileDropArea from "./elements/fileDropArea";
import PlayableContainer from "./elements/playableContainer";
import PlayableItem from "./elements/playableItem";
import PlayableList from "./elements/playableList";
import DraggableHint from "./elements/draggableHint";

export {
	KeyRecorder,
	Slider,
	Toggler,
	Titlebar,
	TextField,
	InfoBalloon,
	FileSelector,
	SoundboardItem,
	SoundboardList,
	Dropdown,
	Tooltip,
	SearchBox,
	IconButton,
	Seekbar,
	MessageHost,
	Draggable,
	FileDropArea,
	PlayableContainer,
	PlayableItem,
	PlayableList,
};

const definitions: [string, CustomElementConstructor][] = [
	["ms-dropdown", Dropdown],
	["ms-fileselector", FileSelector],
	["ms-iconbutton", IconButton],
	["ms-infoballoon", InfoBalloon],
	["ms-keyrecorder", KeyRecorder],
	["ms-searchbox", SearchBox],
	["ms-slider", Slider],
	["ms-soundboard", SoundboardItem],
	["ms-soundboardlist", SoundboardList],
	["ms-sound", PlayableItem],
	["ms-soundlist", PlayableList],
	["ms-textfield", TextField],
	["ms-titlebar", Titlebar],
	["ms-toggler", Toggler],
	["ms-tooltip", Tooltip],
	["ms-seekbar", Seekbar],
	["ms-message-host", MessageHost],
	["ms-filedroparea", FileDropArea],
	["ms-soundcontainer", PlayableContainer],
	["ms-draggablehint", DraggableHint],
];

for (const d of definitions) {
	customElements.define(d[0], d[1]);
}

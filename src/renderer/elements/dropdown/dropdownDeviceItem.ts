import DropDownItem from "./dropdownItem";

export default class DropdownDeviceItem extends DropDownItem {
    constructor(
        public readonly text: string,
        public readonly device: string | null) {
        super(text);
    }
}

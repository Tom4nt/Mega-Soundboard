import DropDownItem from "./DropdownItem";

export default class DropdownTextItem<Data> extends DropDownItem {
    constructor(
        public readonly text: string,
        public readonly data: Data) {
        super();
    }

    protected connectedCallback(): void {
        const node = document.createElement("span");
        node.innerHTML = this.text;
        this.append(node);
    }
}
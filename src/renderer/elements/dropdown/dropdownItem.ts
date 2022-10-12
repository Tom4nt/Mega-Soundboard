export default abstract class DropDownItem extends HTMLElement {
    constructor(
        public readonly text: string) {
        super();
    }

    protected connectedCallback(): void {
        const node = document.createElement("span");
        node.innerHTML = this.text;
        this.append(node);
    }
}

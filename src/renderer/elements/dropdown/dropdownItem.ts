export class DropdownItem extends HTMLElement {
    constructor(
        public readonly text: string,
        public readonly value: unknown,
    ) {
        super();
    }

    protected connectedCallback(): void {
        const node = document.createElement("span");
        node.innerHTML = this.text;
        this.append(node);
    }
}

export default class IconButton extends HTMLElement {
    protected connectedCallback(): void {
        if (this.hasAttribute("red")) {
            this.classList.add("red");
        }
    }

    private _isRed = false;
    set isRed(value: boolean) {
        this._isRed = value;
        if (value) {
            this.classList.add("red");
        } else {
            this.classList.remove("red");
        }
    }

    get isRed(): boolean {
        return this._isRed;
    }
}
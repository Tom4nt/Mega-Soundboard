export default class TextField extends HTMLElement {
    readonly hint: string;

    private mainElement: HTMLInputElement | null = null;

    private _value = "";
    public get value(): string {
        return this._value;
    }
    public set value(v: string) {
        this._value = v;
        if (this.mainElement) this.mainElement.value = v;
    }

    constructor(hint: string) {
        super();
        this.hint = hint;
    }

    protected connectedCallback(): void {
        const input = document.createElement("input");
        input.classList.add("textInput-default");
        input.placeholder = this.hint;
        if (this.value) input.value = this.value;
        input.type = "text";
        this.mainElement = input;
        this.append(input);
    }

    warn(): void {
        if (!this.mainElement) return;
        if (this.mainElement.classList.contains("warn")) return;
        this.mainElement.classList.add("warn");
        setTimeout(() => {
            this.mainElement?.classList.remove("warn");
        }, 400);
    }
}
import MSR from "../msr";

export default abstract class Modal extends HTMLElement {
    static blockClosureKey = false;

    readonly isError: boolean;

    private windowElement!: HTMLDivElement;
    private dimmerElement!: HTMLDivElement;
    private titleElement!: HTMLHeadingElement;

    private _modalTitle = "No Title";
    public get modalTitle(): string {
        return this._modalTitle;
    }
    public set modalTitle(v: string) {
        this._modalTitle = v;
        if (this.isConnected) this.titleElement.innerHTML = v;
    }

    constructor(isError: boolean) {
        super();
        this.isError = isError;
        document.addEventListener("keyup", this.keyUpHandler);
    }

    keyUpHandler = (e: KeyboardEvent): void => {
        if (e.key == "Escape" && this.canCloseWithKey())
            this.close();
    };

    static getButton(label: string, clickCallback: () => void, left = false, red = false): HTMLButtonElement {
        const button = document.createElement("button");
        button.innerHTML = label;
        if (left)
            button.style.float = "left";
        if (red)
            button.classList.add("button-warn");
        button.onclick = clickCallback;
        return button;
    }

    static getLabel(text: string): HTMLParagraphElement {
        const label = document.createElement("p");
        label.classList.add("modal-label");
        label.innerHTML = text;
        return label;
    }

    static getText(text: string): HTMLParagraphElement {
        const textE = document.createElement("p");
        textE.innerHTML = text;
        return textE;
    }

    protected connectedCallback(): void {
        this.classList.add("modal");
        if (this.isError) this.classList.add("error");

        const window = document.createElement("div");
        window.classList.add("modal-window");
        const dimmer = document.createElement("div");
        dimmer.classList.add("modal-dimmer");
        dimmer.addEventListener("click", () => this.close());

        //Header
        const header = document.createElement("div");
        header.classList.add("modal-header");
        window.appendChild(header);

        const titleE = document.createElement("h1");
        this.titleElement = titleE;
        titleE.innerHTML = this._modalTitle;
        header.appendChild(titleE);
        //---

        //Body
        const body = document.createElement("div");
        body.classList.add("modal-body");
        body.append(...this.getContent());
        window.appendChild(body);
        //---

        //Footer
        const footer = document.createElement("div");
        footer.classList.add("modal-footer");
        const buttons = this.getFooterButtons();
        buttons.forEach(button => {
            footer.append(button);
        });
        window.appendChild(footer);

        dimmer.classList.add("hidden");
        window.classList.add("hidden");

        this.windowElement = window;
        this.dimmerElement = dimmer;
        this.append(window, dimmer);
    }

    protected disconnectedCallback(): void {
        document.removeEventListener("keyup", this.keyUpHandler);
    }

    protected abstract getContent(): HTMLElement[];
    protected abstract getFooterButtons(): HTMLButtonElement[];
    protected abstract canCloseWithKey(): boolean;

    open(): void {
        MSR.instance.modalManager.openModal(this);
        void this.show();
    }

    close(): void {
        void (async (): Promise<void> => {
            await this.hide();
            MSR.instance.modalManager.closeModal(this);
        })();
    }

    /** Promise completes after the animation finishes. */
    private show(): Promise<void> {
        void this.offsetWidth; // Triggers Reflow
        this.windowElement.classList.remove("hidden");
        this.dimmerElement.classList.remove("hidden");

        return new Promise(r => {
            this.addEventListener("transitionend", () => r());
        });
    }

    /** Promise completes after the animation finishes. */
    private hide(): Promise<void> {
        this.dispatchEvent(new CustomEvent("close"));
        this.windowElement.classList.add("hidden");
        this.dimmerElement.classList.add("hidden");

        return new Promise(r => {
            this.addEventListener("transitionend", () => r());
        });
    }
}

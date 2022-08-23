import { KeybindManager, MS } from "../../Models";

export default abstract class Modal extends HTMLElement {
    static blockClosureKey = false;

    protected canCloseWithKey = true;
    readonly isError: boolean;

    private windowElement: HTMLDivElement | null = null;
    private dimmerElement: HTMLDivElement | null = null;

    private _modalTitle = "No Title";
    public get modalTitle(): string {
        return this._modalTitle;
    }
    public set modalTitle(v: string) {
        this._modalTitle = v;
        // TODO: Update title element
    }

    constructor(isError: boolean) {
        super();
        this.isError = isError;
        document.addEventListener("keyup", this.keyUpHandler);
    }

    keyUpHandler = (e: KeyboardEvent): void => {
        if (e.key == "Escape" && this.canCloseWithKey && !MS.instance.recordingKey)
            this.close();
    };

    // static linkedSoundboard(path: string): void {
    //     return new Modal('Linked soundboard', 'This soundboard is linked to a <a href="' + path + '">folder</a>.<br/>' +
    //         'Add sounds to the folder they will appear here automatically.')
    // }

    //#region COMPONENTS

    static getButton(label: string, clickCallback: () => void, left: boolean, red: boolean): HTMLButtonElement {
        const button = document.createElement("button");
        button.innerHTML = label.toUpperCase();
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

    //#endregion

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
        titleE.innerHTML = this.title;
        header.appendChild(titleE);
        //---

        //Body
        const body = document.createElement("div");
        body.classList.add("modal-body");
        body.append(this.getContent());
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

    abstract getContent(): HTMLElement;
    abstract getFooterButtons(): HTMLButtonElement[];

    open(parentElement: HTMLElement): void {
        parentElement.appendChild(this);
        void this.offsetWidth; // Trigger Reflow
        this.windowElement?.classList.remove("hidden");
        this.dimmerElement?.classList.remove("hidden");

        // TODO: Create a ModalManager to manage open modals and key locks instead of handling that in KeybindManager and MS.
        KeybindManager.instance.lock = true;
        MS.instance.modalsOpen += 1;
    }

    close(): void {
        if (!this.windowElement) return;
        this.dispatchEvent(new CustomEvent("close"));
        this.windowElement?.classList.add("hidden");
        this.dimmerElement?.classList.add("hidden");
        this.ontransitionend = (): void => this.remove();

        KeybindManager.instance.lock = false;
        MS.instance.modalsOpen -= 1;
    }
}
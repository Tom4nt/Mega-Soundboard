import { ExposedEvent, Event } from "../../shared/events";

export default class SearchBox extends HTMLElement {

    private _onInput = new Event<string>();
    get onInput(): ExposedEvent<string> { return this._onInput.expose(); }

    private _onButtonClick = new Event<void>();
    get onButtonClick(): ExposedEvent<void> { return this._onButtonClick.expose(); }

    protected connectedCallback(): void {
        const btn = document.createElement("button");
        btn.id = "soundlist-searchbox-button";

        const ipt = document.createElement("input");
        ipt.id = "soundlist-searchbox";

        btn.addEventListener("click", () => {
            if (ipt.classList.contains("open")) {
                ipt.classList.remove("open");
                ipt.value = "";
                btn.innerHTML = "search";
            } else {
                ipt.classList.add("open");
                ipt.focus();
                btn.innerHTML = "close";
            }
            this._onButtonClick.raise();
        });

        ipt.addEventListener("input", () => {
            this._onInput.raise(ipt.value);
        });

        document.addEventListener("click", (e) => {
            if (!e.composedPath().includes(ipt) && !e.composedPath().includes(btn) && ipt.value == "") {
                ipt.classList.remove("open");
                ipt.value = "";
                btn.innerHTML = "search";
            }
        });
    }
}

customElements.define("ms-searchbox", SearchBox);
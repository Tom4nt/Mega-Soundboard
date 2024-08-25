import { ExposedEvent, Event } from "../../shared/events";
import IconButton from "./iconButton";

export default class SearchBox extends HTMLElement {

    private _onInput = new Event<string>();
    get onInput(): ExposedEvent<string> { return this._onInput.expose(); }

    private _onButtonClick = new Event<void>();
    get onButtonClick(): ExposedEvent<void> { return this._onButtonClick.expose(); }

    protected connectedCallback(): void {
        const btn = document.createElement("ms-iconbutton") as IconButton;
        btn.id = "soundlist-searchbox-button";
        btn.setAttribute("icon", "search");

        const ipt = document.createElement("input");
        ipt.id = "soundlist-searchbox";

        btn.addEventListener("click", () => {
            if (ipt.classList.contains("open")) {
                ipt.classList.remove("open");
                ipt.value = "";
                btn.setIcon("search");
            } else {
                ipt.classList.add("open");
                ipt.focus();
                btn.setIcon("close");
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
                btn.setIcon("search");
            }
        });

        this.append(btn, ipt);
    }
}

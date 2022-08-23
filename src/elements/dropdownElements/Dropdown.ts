import DropDownItem from "./DropdownItem";
import { Event, ExposedEvent } from "../../util/Event";

export default class Dropdown extends HTMLElement {
    private readonly options: DropDownItem[] = [];
    private _selectedIndex: number | null = null;
    private isOpen = false;

    private mainElement: HTMLDivElement | null = null;
    private containerElement: HTMLDivElement | null = null;
    private textElement: HTMLSpanElement | null = null;

    private readonly _onSelectedItem = new Event<DropDownItem | null>();
    public get onSelectedItem(): ExposedEvent<DropDownItem | null> { return this._onSelectedItem.expose(); }

    get selectedIndex(): number | null {
        return this._selectedIndex;
    }
    set selectedIndex(value: number | null) {
        this._selectedIndex = value;
        this.select(value);
    }

    protected connectedCallback(): void {
        // Can no longer set the items in HTML.
        // for (let i = 0; i < this.childElementCount; i++) {
        //     const node = this.children.item(i);
        //     if (!node || !(node instanceof HTMLElement)) continue;
        //     this.options.push(node);
        //     node.onclick = (): void => {
        //         this._selectedIndex = i;
        //         this._onSelectedItem.raise(i);
        //         this.close();
        //     };
        // }

        const main = document.createElement("div");
        main.classList.add("dropdown-default");
        main.onclick = (): void => this.toggleOpen();
        this.mainElement = main;

        const text = document.createElement("span");
        text.classList.add("dropdown-text");
        text.innerHTML = "Select...";
        this.textElement = text;

        const arrow = document.createElement("span");
        arrow.classList.add("dropdown-arrow");
        arrow.innerHTML = "&#9207;";

        const itemsContainer = document.createElement("div");
        itemsContainer.classList.add("dropdown-container");
        this.containerElement = itemsContainer;

        this.options.forEach((node) => {
            itemsContainer.append(node);
        });

        main.append(text, arrow);
        this.append(main, itemsContainer);

        window.addEventListener("click", (e) => {
            if (!e.composedPath().includes(this)) this.close();
        });
    }

    // Not to call directly. Called in the setter.
    private select(index: number | null): void {
        this.options.forEach((option) => {
            option.classList.remove("selected");
        });
        if (!index) {
            this._onSelectedItem.raise(null);
            return;
        }
        this.options[index].classList.add("selected");
        if (this.textElement) this.textElement.innerHTML = this.options[index].innerHTML;
        this._onSelectedItem.raise(this.options[index]);
    }

    selectItem(item: DropDownItem): void {
        const index = this.options.indexOf(item);
        if (index < 0) throw "Specified item is not present in the Dropdown.";
        this.selectedIndex = index;
    }

    addItem(item: DropDownItem): void {
        this.containerElement?.append(item);
        this.options.push(item);
        item.onclick = (): void => {
            this.selectItem(item);
            this.close();
        };
    }

    removeItem(index: number): void {
        if (!this.containerElement) {
            this.options.slice(index, 1);
        } else {
            const element = this.containerElement.childNodes.item(index);
            if (!element) throw "The element was not found";
            this.containerElement.removeChild(element);
            this.options.slice(index, 1);
        }
    }

    toggleOpen(): void {
        if (this.isOpen) this.close();
        else this.open();
    }

    open(): void {
        if (!this.containerElement || !this.mainElement || this.containerElement.childElementCount < 1) return;

        this.isOpen = true;
        this.containerElement.classList.add("open");
        let totalHeight = 0;
        for (let i = 0; i < this.containerElement.childElementCount; i++) {
            const element = this.containerElement.children[i];
            if (!(element instanceof HTMLElement)) continue;
            totalHeight += element.offsetHeight;
        }
        const max = document.documentElement.clientHeight - this.mainElement.getBoundingClientRect().bottom;
        const min = totalHeight + 2;

        // Calculate if a scrollbar is necessary
        if (min > max) {
            this.containerElement.style.height = `${max}px`;
            this.containerElement.style.overflowY = "auto";
        } else {
            this.containerElement.style.height = `${min}px`;
            this.containerElement.style.overflowY = "hidden";
        }
        this.mainElement.classList.add("open");
    }

    close(): void {
        this.isOpen = false;
        if (this.containerElement) this.containerElement.style.height = "0";
        this.containerElement?.classList.remove("open");
        this.mainElement?.classList.remove("open");
    }
}
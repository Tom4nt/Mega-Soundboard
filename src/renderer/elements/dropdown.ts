import { Event, ExposedEvent } from "../../shared/events";
import { DropdownItem } from "./dropdown/dropdownItem";

customElements.define("ms-dropdownitem", DropdownItem);

export { DropdownItem as DropDownItem };

export default class Dropdown extends HTMLElement {
	private readonly options: DropdownItem[] = [];
	private _selectedIndex: number | null = null;
	private isOpen = false;

	private mainElement!: HTMLDivElement;
	private containerElement!: HTMLDivElement;
	private textElement!: HTMLSpanElement;

	private readonly _onSelectedItem = new Event<DropdownItem | null>();
	public get onSelectedItem(): ExposedEvent<DropdownItem | null> { return this._onSelectedItem.expose(); }

	get selectedIndex(): number | null {
		return this._selectedIndex;
	}
	set selectedIndex(value: number | null) {
		this._selectedIndex = value;
		this.select(value);
	}

	get selectedItem(): DropdownItem | null {
		if (this.selectedIndex === null) return null;
		return this.options[this.selectedIndex] ?? null;
	}

	protected connectedCallback(): void {
		const main = document.createElement("div");
		main.classList.add("dropdown-default");
		main.classList.add("dark");
		main.onclick = (): void => this.toggleOpen();
		this.mainElement = main;

		const text = document.createElement("span");
		text.classList.add("dropdown-text");
		text.innerHTML = "Select...";
		this.textElement = text;

		const arrow = document.createElement("i");
		arrow.classList.add("dropdown-arrow");
		arrow.innerHTML = "arrow_drop_down";

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
		if (index === null) return;
		const opt = this.options[index];
		if (opt) {
			opt.classList.add("selected");
			if (this.isConnected) this.textElement.innerHTML = opt.text;
		}
	}

	findItem(predicate: (item: DropdownItem) => boolean): DropdownItem | undefined {
		return this.options.find((v) => {
			return predicate(v);
		});
	}

	/** Selects the item found using the specified predicate. Returns whether the item was found/selected. */
	selectIfFound(predicate: (item: DropdownItem) => boolean): boolean {
		const item = this.findItem(predicate);
		if (item) {
			this.selectItem(item);
			return true;
		}
		else return false;
	}

	selectItem(item: DropdownItem): void {
		const index = this.options.indexOf(item);
		if (index < 0) throw new Error("Specified item is not present in the Dropdown.");
		this.selectedIndex = index;
	}

	selectItemWithValue(value: unknown): void {
		const item = this.options.find(i => i.value == value);
		if (!item) throw new Error("Specified item is not present in the Dropdown.");
		this.selectItem(item);
	}

	addItems(...items: DropdownItem[]): void {
		items.forEach(i => this.addItem(i));
	}

	addItem(item: DropdownItem): void {
		this.containerElement.append(item);
		this.options.push(item);
		item.onclick = (): void => {
			this.selectItem(item);
			this._onSelectedItem.raise(item);
			this.close();
		};
	}

	removeItem(index: number): void {
		const element = this.containerElement.childNodes[index];
		if (element) {
			this.containerElement.removeChild(element);
			this.options.slice(index, 1);
		}
	}

	toggleOpen(): void {
		if (this.isOpen) this.close();
		else this.open();
	}

	open(): void {
		if (this.containerElement.childElementCount < 1) return;

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
		this.containerElement.style.height = "0";
		this.containerElement.classList.remove("open");
		this.mainElement.classList.remove("open");
	}
}

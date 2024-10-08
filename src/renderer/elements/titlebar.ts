export default class Titlebar extends HTMLElement {
	private dragAreaElement!: HTMLDivElement;
	private sizeButton!: HTMLButtonElement;

	private isMaximized = false;

	constructor() {
		super();

		window.events.windowStateChanged.addHandler(s => {
			if (s == "maximized" || s == "restored") {
				this.isMaximized = s == "maximized";
				this.update();
			}
		});
	}

	connectedCallback(): void {
		const dragArea = document.createElement("div");
		dragArea.classList.add("drag");
		this.dragAreaElement = dragArea;

		const title = document.createElement("span");
		title.innerHTML = this.getAttribute("main") ?? "No Title";

		const btnClose = document.createElement("button");
		const btnSize = document.createElement("button");
		const btnMin = document.createElement("button");

		btnClose.tabIndex = -1;
		btnClose.innerHTML = "close";
		btnClose.classList.add("red");
		btnClose.onclick = (): void => {
			window.actions.close();
		};

		btnSize.tabIndex = -1;
		btnSize.innerHTML = "fullscreen";
		btnSize.onclick = (): void => {
			window.actions.toggleMaximizedState();
		};
		this.sizeButton = btnSize;

		btnMin.tabIndex = -1;
		btnMin.innerHTML = "horizontal_rule";
		btnMin.onclick = (): void => {
			window.actions.minimize();
		};

		this.append(title, dragArea, btnClose, btnSize, btnMin);
	}

	update(): void {
		if (this.isMaximized) {
			this.sizeButton.innerHTML = "fullscreen_exit";
			this.dragAreaElement.style.top = "0";
		} else {
			this.sizeButton.innerHTML = "fullscreen";
			this.dragAreaElement.style.top = "";
		}
	}
}

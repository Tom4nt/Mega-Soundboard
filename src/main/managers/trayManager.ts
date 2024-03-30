import { app, BrowserWindow, Menu, Tray } from "electron";
import * as path from "path";
import Utils from "../utils/utils";
import { isAction, actionFriendlyNames, actionNames, actionDefaults, ActionName } from "../../shared/quickActions";
import { actionBindings } from "../quickActionBindings";
import MS from "../ms";

const iconWhitePath = path.join(Utils.resourcesPath, "icon_white.ico");
const iconPausedPath = path.join(Utils.resourcesPath, "icon_dot.ico");

export default class TrayManager {
	private tray!: Tray;
	private trayMenu!: Menu;

	private constructor() { /* */ }

	static createTray(win: BrowserWindow, quickActionStates: Map<ActionName, boolean>): TrayManager {
		const instance = new TrayManager();
		instance.tray = new Tray(iconWhitePath);

		const trayItems: Electron.MenuItemConstructorOptions[] = [];
		for (const key of actionNames) {
			const actionName = actionFriendlyNames[key];
			const actionDefault = actionDefaults[key];
			trayItems.push({
				id: key,
				label: actionName,
				type: actionDefault === null ? "normal" : "checkbox",
				click: (): void => {
					void actionBindings[key](key as never);
				}
			});
		}

		instance.trayMenu = Menu.buildFromTemplate([
			...trayItems,
			{ type: "separator" },
			{
				label: "Show",
				click: (): void => {
					this.showWindow(win);
				}
			},
			{
				label: "Close",
				click: (): void => {
					app.quit();
				}
			}
		]);

		instance.tray.setContextMenu(instance.trayMenu);
		instance.tray.on("click", () => {
			this.showWindow(win);
		});

		instance.update(quickActionStates);
		return instance;
	}

	update(quickActionStates: Map<ActionName, boolean>): void {
		for (const k in quickActionStates) {
			if (!isAction(k)) return;
			const keysItem = this.trayMenu.getMenuItemById(k);
			if (keysItem) keysItem.checked = quickActionStates.get(k)!;

			if (k === "toggleKeybinds") { // Specific for this action.
				this.tray.setImage(quickActionStates.get(k) ? iconWhitePath : iconPausedPath);
				this.tray.setToolTip(quickActionStates.get(k) ? "Mega Soundboard" : "Mega Soundboard (Keybinds disabled)");
			}
		}
	}

	private static showWindow(window: BrowserWindow): void {
		window.show();
		if (MS.instance.windowManager.isMainWindowMaximized) {
			window.maximize();
		}
	}
}

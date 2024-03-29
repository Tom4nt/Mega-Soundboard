import { Events, EventsMap } from "../shared/ipcEvents";
import MS from "./ms";

export default class EventSender {

    static send<T extends keyof Events>(name: T, param?: EventsMap[T]): void {
        if (!MS.instance.windowManager.mainWindow.isDestroyed())
            MS.instance.windowManager.mainWindow.webContents.send(name, param);
    }
}

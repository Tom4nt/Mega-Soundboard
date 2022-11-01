import { Events, EventsMap } from "../shared/ipcEvents";
import MS from "./ms";

export default class EventSender {

    static send<T extends keyof Events>(name: T, param?: EventsMap[T]): void {
        MS.instance.windowManager.window.webContents.send(name, param);
    }
}

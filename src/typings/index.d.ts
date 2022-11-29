import InitialContent from "../shared/models/initialContent";
import { Actions } from "../shared/ipcActions";
import { Events } from "../shared/ipcEvents";

declare global {
    interface HTMLMediaElement {
        setSinkId(sinkId: string): Promise<undefined>
    }

    interface Window {
        events: Events,
        actions: Actions,
        getInitialContent: () => InitialContent,
    }
}

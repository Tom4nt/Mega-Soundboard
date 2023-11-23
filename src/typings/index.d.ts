import InitialContent from "../shared/models/initialContent";
import { Actions } from "../shared/ipcActions";
import { Events } from "../shared/ipcEvents";

declare global {
    interface HTMLMediaElement {
        setSinkId(sinkId: string): Promise<undefined>
    }

    interface Window {
        // events: Events,
        actions: Actions,
        events: Events, // TODO: Temp
        addListener: <T extends keyof Events>(name: T, f: (param: unknown) => void) => void;
        getInitialContent: () => InitialContent,
    }

    interface String {
        /** Checks if the string contains the other. Implemented in sharedUtils. */
        contains(other: string): boolean;
    }
}

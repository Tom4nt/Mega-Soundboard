import { IInitialContent } from "../shared/models/dataInterfaces";
import { Actions } from "../shared/ipcActions";
import { Events } from "../shared/ipcEvents";

declare global {
	interface HTMLMediaElement {
		setSinkId(sinkId: string): Promise<undefined>
	}

	interface Window {
		actions: Actions,
		events: Events,
		addListener: <T extends keyof Events>(name: T, f: (param: unknown) => void) => void;
		getInitialContent: () => IInitialContent,
	}

	interface String {
		/** Checks if the string contains the other. Implemented in sharedUtils. */
		contains(other: string): boolean;
	}
}

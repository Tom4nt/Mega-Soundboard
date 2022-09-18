import { ExposedEvent } from "../shared/events";
import { Sound } from "../shared/models";

declare global {
    interface HTMLMediaElement {
        setSinkId(sinkId: string): Promise<undefined>
    }

    interface Window {
        events: Events
    }

    interface Events {
        onKeybindsStateChanged: ExposedEvent<boolean>,
        onSoundAdded: ExposedEvent<Sound>,
        onSoundRemoved: ExposedEvent<Sound>,
    }
}

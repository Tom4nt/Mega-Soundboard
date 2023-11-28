import { isGroup } from "../../shared/models/group";
import { Playable } from "../../shared/models/playable";
import { Sound, isSound } from "../../shared/models/sound";

// TODO: Move model definitions to the main process. Use classes. Pass simplified objects to the renderer process.
export function getSound(playable: Playable): Sound | undefined {
    if (isSound(playable)) return playable;
    if (isGroup(playable)) {
        if (playable.playables.length <= 0) return undefined;
        let index = 0;
        switch (playable.mode) {
            case "first":
                index = 0;
                break;
            case "sequence":
                playable.current = (playable.current + 1) % playable.playables.length;
                index = playable.current;
                break;
            case "random":
                index = Math.floor(Math.random() * playable.playables.length);
                break;
        }
        return getSound(playable.playables[index]!);
    }
    return undefined;
}

import { MessageModal } from "../modals";
import { Keys, MS, Sound, UISoundPath } from "../../shared/models";

// TODO: Extend future "DraggableElement"
export default class SoundItem extends HTMLElement {
    private titleElement!: HTMLSpanElement;
    private detailsElement!: HTMLSpanElement;
    private indicatorElement!: HTMLDivElement;

    constructor(public readonly sound: Sound) {
        super();
    }

    protected connectedCallback(): void {
        this.classList.add("item");

        this.titleElement = document.createElement("span");
        this.titleElement.style.pointerEvents = "none";

        this.detailsElement = document.createElement("span");
        this.detailsElement.classList.add("desc");
        this.detailsElement.style.pointerEvents = "none";

        const playingIndicator = document.createElement("div");
        playingIndicator.classList.add("indicator");

        this.update();

        this.append(this.titleElement, this.detailsElement, playingIndicator);

        const handleSoundClick = async (e: MouseEvent): Promise<void> => {
            if (e.target === playingIndicator) return;
            try {
                await MS.instance.playSound(this.sound);
            } catch (error) {
                const errorText = typeof error == "string" ? error : "Error";
                new MessageModal("Could not play", errorText, true).open(this); // TODO: Cannot set parent here. Must use a Modal Manager.
                await MS.instance.playUISound(UISoundPath.ERROR);
            }
        };

        this.addEventListener("click", e => void handleSoundClick(e));

        this.addEventListener("auxclick", e => {
            if (e.button === 1) {
                MS.instance.stopSound(this.sound);
            }
        });

        playingIndicator.addEventListener("click", () => {
            MS.instance.stopSound(this.sound);
        });
    }

    setPlayingState(playingState: boolean): void {
        if (playingState) {
            this.indicatorElement.style.top = "-11px";
            this.indicatorElement.style.right = "-11px";
        } else {
            this.indicatorElement.style.top = "";
            this.indicatorElement.style.right = "";
        }
    }

    update(): void {
        this.titleElement.innerHTML = this.sound.name;
        this.detailsElement.innerHTML = Keys.toKeyString(this.sound.keys);
    }
}
import { SoundboardItem } from "../elements";
import { Soundboard } from "../../shared/models";
import MSR from "../msr";
import Utils from "../util/utils";

export default class SoundboardList extends HTMLElement {
    private selectedItem?: SoundboardItem;
    private dragElement: SoundboardItem | null = null;
    private dragDummy!: HTMLDivElement;

    private *getItems(): Generator<SoundboardItem> {
        for (let i = 0; i < this.childElementCount; i++) {
            const element = this.childNodes[i];
            if (element instanceof SoundboardItem) {
                yield element;
            }
        }
    }

    protected connectedCallback(): void {
        // Add drag dummy item
        const item = document.createElement("div");
        item.classList.add("item", "dragdummy");
        this.dragDummy = item;
        this.appendChild(item);

        window.events.onCurrentSoundboardChanged.addHandler(sb => {
            this.updateSeleced(sb);
        });

        MSR.instance.audioManager.onPlaySound.addHandler(s => {
            if (!s.connectedSoundboard) return;
            const elem = this.getSoundboardElement(s.connectedSoundboard);
            elem?.updatePlayingIndicator(1);
        });

        MSR.instance.audioManager.onStopSound.addHandler(s => {
            const sb = this.getSelectedSoundboard();
            if (!sb) return;
            const sound = sb.sounds.find(x => x.uuid = s);
            if (!sound) return;
            const elem = this.getSoundboardElement(sb);
            elem?.updatePlayingIndicator(-1);
        });

        this.addEventListener("dragover", this.handleDragOver);
    }

    getSelectedSoundboard(): Soundboard | null {
        if (this.selectedItem)
            return this.selectedItem.soundboard;
        return null;
    }

    addSoundboard(soundboard: Soundboard): void {
        const sbElement = new SoundboardItem(soundboard);
        sbElement.addEventListener("dragstart", () => {
            this.dragElement = sbElement;
            this.showDragDummy();
        });

        sbElement.addEventListener("dragend", this.handleDrop);

        sbElement.addEventListener("click", () => {
            if (!sbElement.isSelected) {
                window.actions.setCurrentSoundboard(sbElement.soundboard.uuid);
            }
        });

        this.appendChild(sbElement);
    }

    /** Updates the information about playing sounds in a soundboard. */
    incrementPlayingSound(soundboard: Soundboard, increment: number): void {
        const elem = this.getSoundboardElement(soundboard);
        if (!elem) return;
        elem.updatePlayingIndicator(increment);
    }

    private updateSeleced(soundboard: Soundboard): void {
        for (const item of this.getItems()) {
            if (item.soundboard.equals(soundboard)) {
                item.isSelected = true;
            }
        }
    }

    private hideDragDummy(): void {
        this.dragDummy.style.display = "";
    }

    private showDragDummy(): void {
        this.dragDummy.style.display = "inline-block";
    }

    /** Returns the element from the list representing a specific soundboard. Returns null if no element is found. */
    private getSoundboardElement(soundboard: Soundboard): SoundboardItem | null {
        for (const item of this.getItems()) {
            if (item.soundboard.equals(soundboard)) return item;
        }
        return null;
    }

    /** Sets all playing indicators to a specific state. */
    private setAllPlayingIndicators(state: boolean): void {
        for (const item of this.getItems()) {
            item.setPlayingIndicatorState(state);
        }
    }

    // Handlers

    private handleDragOver = (e: DragEvent): void => {
        const target = document.elementFromPoint(this.getBoundingClientRect().x, e.clientY);

        if (!target) return;
        if (!(target instanceof SoundboardItem)) return;

        if (this.dragElement) {
            if (Utils.getElementIndex(this.dragDummy) > Utils.getElementIndex(target)) {
                this.insertBefore(this.dragDummy, target);
            } else {
                this.insertBefore(this.dragDummy, target.nextElementSibling);
            }
        } else {
            const curr = this.getSelectedSoundboard();
            if (!curr || !target.soundboard.equals(curr))
                window.actions.setCurrentSoundboard(target.soundboard.uuid);
        }
    };

    private handleDrop = (): void => {
        const sb = this.getSelectedSoundboard();
        if (!this.dragElement || !sb) return;

        this.insertBefore(this.dragElement, this.dragDummy.nextElementSibling);
        const newIndex = Utils.getElementIndex(this.dragElement);

        window.actions.moveSoundboard(sb.uuid, newIndex);

        this.hideDragDummy();
    };
}

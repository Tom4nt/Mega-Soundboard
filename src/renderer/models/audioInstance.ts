import { Event, ExposedEvent } from "../../shared/events";
import { IDevice } from "../../shared/interfaces";
import { Sound } from "../../shared/models";

/** Represents a single sound playing on multiple devices. */
export default class AudioInstance {
    public get onStop(): ExposedEvent<void> { return this.stopEvent.expose(); }

    public static async create(
        sound: Sound,
        devices: IDevice[],
        volumeMult: number,
    ): Promise<AudioInstance> {
        const sinkIdPromises: Promise<void>[] = [];
        const audioElements: HTMLAudioElement[] = [];
        const stopEvent = new Event<void>();
        for (const device of devices) {
            const audio = new Audio(sound.path);
            audio.addEventListener("ended", () => {
                audioElements.splice(audioElements.indexOf(audio), 1);
                if (audioElements.length <= 0) {
                    stopEvent.raise();
                }
            });

            audio.volume = Math.pow((device.volume / 100) * (sound.volume / 100) * (volumeMult), 2);
            const p = audio.setSinkId(device.id).catch(() => { console.error(`Error setting SinkId for ${device.id}.`); });
            sinkIdPromises.push(p);
            audioElements.push(audio);
        }
        await Promise.all(sinkIdPromises);
        return new AudioInstance(sound, audioElements, volumeMult, stopEvent);
    }

    private constructor(
        public readonly sound: Sound,
        public readonly audioElements: HTMLAudioElement[],
        public readonly volumeMult: number,
        private readonly stopEvent: Event<void>,
    ) { }

    pause(): void {
        this.audioElements.forEach(x => x.pause());
        this.audioElements.length = 0;
    }

    async play(): Promise<void> {
        const playTasks: Promise<void>[] = [];
        for (const audioElement of this.audioElements) {
            const t = audioElement.play();
            playTasks.push(t);
        }
        await Promise.all(playTasks);
    }
}

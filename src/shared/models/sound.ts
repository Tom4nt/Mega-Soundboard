// All functions must be static so instances can be passed between processes.
export default class Sound {
    soundboardUuid: string | null = null;

    constructor(
        public uuid: string,
        public name: string,
        public path: string,
        public volume: number,
        public keys: number[]) {
    }

    static equals(from: Sound, to: Sound): boolean {
        return from.uuid == to.uuid;
    }

    static toJSON(sound: Sound): object {
        return {
            name: sound.name,
            path: sound.path,
            volume: sound.volume,
            keys: sound.keys
        };
    }
}

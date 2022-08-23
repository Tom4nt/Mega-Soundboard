import { ipcRenderer } from "electron";
import { MS, Sound, Soundboard, UISoundPath } from "../Models";

const LOG = false;

export enum KeybindManagerEvent {
    EVENT_SELECT_SOUNDBOARD = "soundboard-select",
    EVENT_SOUND_PLAY = "sound-play"
}

export default class KeybindManager {
    eventDispatcher = new EventTarget();

    lock = false;

    private actions: (() => Promise<void>)[] = [];
    private sounds: { id: number, sound: Sound }[] = [];
    private soundboards: { id: number, soundboard: Soundboard }[] = [];
    private actionIDs: { id: number, code: number }[] = [];

    private static _instance: KeybindManager | null = new KeybindManager();
    static get instance(): KeybindManager {
        if (!this._instance) throw "KeybindManager was not initialized";
        return this._instance;
    }
    private static set instance(value: KeybindManager) {
        this._instance = value;
    }

    private constructor() {
        ipcRenderer.on("key.perform", (_e, id: number) => {
            if (this.actions[id]) {
                void this.actions[id]();
            }
        });
    }

    async registerSoundboardn(soundboard: Soundboard): Promise<void> {
        await this.unregisterSoundboard(soundboard);
        if (!soundboard.keys) return;
        const id = await ipcRenderer.invoke("key.register", soundboard.keys) as number;
        if (LOG) console.log(`Registered ${soundboard.name} with the id of ${id}`);
        this.actions[id] = (): Promise<void> => Promise.resolve(this._selectSoundboard(soundboard));
        this.soundboards.push({ id: id, soundboard: soundboard });
    }

    async unregisterSoundboardAndSounds(soundboard: Soundboard): Promise<void> {
        await this.unregisterSounds(soundboard);
        await this.unregisterSoundboard(soundboard); // TODO: Await all
    }

    async unregisterSoundboard(soundboard: Soundboard): Promise<void> {
        const existingID = this._getIdFromSoundboard(soundboard);
        if (existingID) {
            if (LOG) console.log(`Uregistering ${soundboard.name} (ID: ${existingID})`);
            await ipcRenderer.invoke("key.unregister", existingID);
            delete this.actions[existingID];
            this._deleteSoundboard(soundboard);
        }
    }

    async registerSound(sound: Sound): Promise<void> {
        await this.unregisterSound(sound);
        if (!sound.keys) return;
        const id = await ipcRenderer.invoke("key.register", sound.keys) as number;
        if (LOG) console.log(`Registered ${sound.name} with the id of ${id}`);
        this.actions[id] = async (): Promise<void> => await this._playSound(sound);
        this.sounds.push({ id: id, sound: sound });
    }

    async unregisterSound(sound: Sound): Promise<void> {
        const existingID = this._getIdFromSound(sound);
        if (existingID) {
            if (LOG) console.log(`Uregistering ${sound.name} (ID: ${existingID})`);
            await ipcRenderer.invoke("key.unregister", existingID);
            delete this.actions[existingID];
            this._deleteSound(sound);
        }
    }

    async unregisterSounds(soundboard: Soundboard): Promise<void> {
        const tasks: Promise<void>[] = [];
        soundboard.sounds.forEach(sound => {
            tasks.push(this.unregisterSound(sound));
        });
        await Promise.all(tasks);
    }

    async registerAction(keybind: number[], action: () => Promise<void>, code: number): Promise<void> {
        await this.unregisterAction(code);
        if (!keybind) return;
        const id = await ipcRenderer.invoke("key.register", keybind) as number;
        if (LOG) console.log(`Registered an action with the id of ${id}`);
        this.actions[id] = action;
        this.actionIDs.push({ id: id, code: code });
    }

    async unregisterAction(code: number): Promise<void> {
        const existingID = this._getIDFromCode(code);
        if (existingID) {
            if (LOG) console.log(`Uregistering action. (ID: ${existingID})`);
            await ipcRenderer.invoke("key.unregister", existingID);
            delete this.actions[existingID];
            this._deleteActionID(code);
        }
    }

    _getIdFromSoundboard(soundboard: Soundboard): number | null {
        const res = this.soundboards.find(element => {
            return element.soundboard == soundboard;
        });
        return res?.id ?? null;
    }

    _getIdFromSound(sound: Sound): number | null {
        const res = this.sounds.find(element => {
            return element.sound == sound;
        });
        return res?.id ?? null;
    }

    _getIDFromCode(code: number): number | null {
        const res = this.actionIDs.find(element => {
            return element.code == code;
        });
        return res?.id ?? null;
    }

    _deleteSoundboard(soundboard: Soundboard): void {
        let id = null;
        for (let i = 0; i < this.soundboards.length; i++) {
            const element = this.soundboards[i];
            if (element.soundboard == soundboard) {
                id = i;
                break;
            }
        }
        if (id) this.soundboards.splice(id, 1);
    }

    _deleteSound(sound: Sound): void {
        let id = null;
        for (let i = 0; i < this.sounds.length; i++) {
            const element = this.sounds[i];
            if (element.sound == sound) {
                id = i;
                break;
            }
        }
        if (id) this.sounds.splice(id, 1);
    }

    _deleteActionID(code: number): void {
        let id = null;
        for (let i = 0; i < this.actionIDs.length; i++) {
            const element = this.actionIDs[i];
            if (element.code == code) {
                id = i;
                break;
            }
        }
        if (id) this.actionIDs.splice(id, 1);
    }

    async _playSound(sound: Sound): Promise<void> {
        if (MS.instance.settings.enableKeybinds && !this.lock) {
            if (LOG) console.log("Playing sound " + sound.name + " via keybind.");
            try {
                await MS.instance.playSound(sound);
            } catch (error) {
                await MS.instance.playUISound(UISoundPath.ERROR);
            }
        }
    }

    _selectSoundboard(soundboard: Soundboard): void {
        if (MS.instance.settings.enableKeybinds && !this.lock) {
            if (LOG) console.log("Selecting Soundboard " + soundboard.name + " via keybind.");
            const detail = { soundboard: soundboard };
            this.eventDispatcher.dispatchEvent(new CustomEvent(KeybindManagerEvent.EVENT_SELECT_SOUNDBOARD, { detail: detail }));
        }
    }
}
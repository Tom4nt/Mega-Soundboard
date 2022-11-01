import { ipcRenderer } from "electron";
import { Sound, Soundboard } from "../../shared/models";
import { Event, ExposedEvent } from "../../shared/events";

// TODO: Remake.
export enum KeybindManagerEvent {
    EVENT_SELECT_SOUNDBOARD = "soundboard-select",
    EVENT_SOUND_PLAY = "sound-play"
}

export default class KeybindManager {

    // Register global settings keybinds
    // await KeybindManager.instance.registerAction(MS.instance.settings.stopSoundsKeys, () => MS.instance.stopAllSounds(), "stop-sounds");
    // await KeybindManager.instance.registerAction(MS.instance.settings.enableKeybindsKeys, () => MS.instance.toggleKeybindsState(), "toggle-keybinds-state");

    eventDispatcher = new EventTarget();

    lock = false;

    public get onSelectSoundboard(): ExposedEvent<Soundboard> { return this._onSelectSoundboard.expose(); }
    private readonly _onSelectSoundboard = new Event<Soundboard>();

    private actions: (() => Promise<void> | void)[] = [];
    private sounds: { id: number, sound: Sound }[] = [];
    private soundboards: { id: number, soundboard: Soundboard }[] = [];
    private actionIDs: { id: number, code: string }[] = [];

    private static _instance: KeybindManager = new KeybindManager();
    static get instance(): KeybindManager {
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
        const id = await ipcRenderer.invoke("key.register", soundboard.keys) as number;
        console.log(`Registered ${soundboard.name} with the id of ${id}`);
        // this.actions[id] = (): Promise<void> => Promise.resolve(this._selectSoundboard(soundboard));
        this.soundboards.push({ id: id, soundboard: soundboard });
    }

    async unregisterSoundboardAndSounds(soundboard: Soundboard): Promise<void> {
        await this.unregisterSounds(soundboard);
        await this.unregisterSoundboard(soundboard);
    }

    async unregisterSoundboard(soundboard: Soundboard): Promise<void> {
        const existingID = this._getIdFromSoundboard(soundboard);
        if (existingID) {
            console.log(`Uregistering ${soundboard.name} (ID: ${existingID})`);
            await ipcRenderer.invoke("key.unregister", existingID);
            delete this.actions[existingID];
            this._deleteSoundboard(soundboard);
        }
    }

    async registerSound(sound: Sound): Promise<void> {
        await this.unregisterSound(sound);
        const id = await ipcRenderer.invoke("key.register", sound.keys) as number;
        console.log(`Registered ${sound.name} with the id of ${id}`);
        // this.actions[id] = async (): Promise<void> => await this._playSound(sound);
        this.sounds.push({ id: id, sound: sound });
    }

    async unregisterSound(sound: Sound): Promise<void> {
        const existingID = this._getIdFromSound(sound);
        if (existingID) {
            console.log(`Uregistering ${sound.name} (ID: ${existingID})`);
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

    async registerAction(keybind: number[], action: () => Promise<void> | void, code: string): Promise<void> {
        await this.unregisterAction(code);
        const id = await ipcRenderer.invoke("key.register", keybind) as number;
        console.log(`Registered an action with the id of ${id}`);
        this.actions[id] = action;
        this.actionIDs.push({ id: id, code: code });
    }

    async unregisterAction(code: string): Promise<void> {
        const existingID = this._getIDFromCode(code);
        if (existingID) {
            console.log(`Uregistering action. (ID: ${existingID})`);
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

    _getIDFromCode(code: string): number | null {
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

    _deleteActionID(code: string): void {
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

    // async _playSound(sound: Sound): Promise<void> {
    //     if (MS.instance.settings.enableKeybinds && !this.lock) {
    //         console.log("Playing sound " + sound.name + " via keybind.");
    //         try {
    //             MSR.instance.audioManager.playSound(sound.path);
    //         } catch (error) {
    //             await MSR.instance.audioManager.playUISound(UISoundPath.ERROR);
    //         }
    //     }
    // }

    // _selectSoundboard(soundboard: Soundboard): void {
    //     if (MS.instance.settings.enableKeybinds && !this.lock) {
    //         console.log("Selecting Soundboard " + soundboard.name + " via keybind.");
    //         this._onSelectSoundboard.raise(soundboard);
    //     }
    // }
}

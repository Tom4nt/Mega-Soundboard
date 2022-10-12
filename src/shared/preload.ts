import { contextBridge, ipcRenderer } from "electron";
import { getFromRenderer } from "./ipcChannels";
import { OptionalSettings, Settings, Sound, Soundboard } from "./models";
import "./preload.events";

contextBridge.exposeInMainWorld("actions", {
    toggleKeybindsState() {
        void ipcRenderer.invoke(getFromRenderer("toggleKeybindsState"));
    },
    toggleOverlapSoundsState() {
        void ipcRenderer.invoke(getFromRenderer("toggleOverlapSoundsState"));
    },
    setMinimizeToTray(value: boolean) {
        void ipcRenderer.invoke(getFromRenderer("setMinToTray"), value);
    },
    addSounds(sounds: Sound[], soundboardId: string, move: boolean, startIndex?: number) {
        void ipcRenderer.invoke(getFromRenderer("addSounds"), sounds, soundboardId, move, startIndex);
    },
    editSound(sound: Sound) {
        void ipcRenderer.invoke(getFromRenderer("editSound"), sound);
    },
    deleteSound(soundId: string) {
        void ipcRenderer.invoke(getFromRenderer("deleteSound"), soundId);
    },
    addSoundboard(soundboard: Soundboard) {
        void ipcRenderer.invoke(getFromRenderer("addSoundboard"), soundboard);
    },
    deleteSoundboard(soundboardId: string) {
        void ipcRenderer.invoke(getFromRenderer("deleteSoundboard"), soundboardId);
    },
    editSoundboard(soundboard: Soundboard) {
        void ipcRenderer.invoke(getFromRenderer("editSoundboard"), soundboard);
    },
    flagChangelogViewed() {
        void ipcRenderer.invoke(getFromRenderer("flagChangelogViewed"));
    },
    moveSound(soundId: string, destinationSoundboardId: string, destinationIndex: number) {
        void ipcRenderer.invoke(getFromRenderer("moveSound"), soundId, destinationSoundboardId, destinationIndex);
    },
    moveSoundboard(soundboardId: string, destinationIndex: number) {
        void ipcRenderer.invoke(getFromRenderer("moveSoundboard"), soundboardId, destinationIndex);
    },
    installUpdate() {
        void ipcRenderer.invoke(getFromRenderer("installUpdate"));
    },
    setDeviceId(index: number, id: string) {
        void ipcRenderer.invoke(getFromRenderer("setDeviceId"), index, id);
    },
    setDeviceVolume(index: number, volume: number) {
        void ipcRenderer.invoke(getFromRenderer("setDeviceVolume"), index, volume);
    },
    saveSettings(settings: OptionalSettings) {
        void ipcRenderer.invoke(getFromRenderer("saveSettings"), settings);
    },
    minimize() {
        void ipcRenderer.invoke(getFromRenderer("minimize"));
    },
    toggleMaximizedState() {
        void ipcRenderer.invoke(getFromRenderer("toggleMaximizedState"));
    },
    close() {
        void ipcRenderer.invoke(getFromRenderer("close"));
    },
    openRepo() {
        void ipcRenderer.invoke(getFromRenderer("openRepo"));
    },
    openBugReport() {
        void ipcRenderer.invoke(getFromRenderer("openBugReport"));
    },
    stopKeyRecordingSession(id: string) {
        void ipcRenderer.invoke(getFromRenderer("stopKeyRecordingSession"), id);
    },
    setCurrentSoundboard(id: string) {
        void ipcRenderer.invoke(getFromRenderer("setCurrentSoundboard"), id);
    },
});

contextBridge.exposeInMainWorld("functions", {
    async getNewSoundsFromPaths(paths: string[]): Promise<Sound[]> {
        return await ipcRenderer.invoke(getFromRenderer("getSoundsFromPaths"), paths) as Sound[];
    },
    async getNewSoundboard(): Promise<Soundboard> {
        return await ipcRenderer.invoke(getFromRenderer("getNewSoundboard")) as Soundboard;
    },
    async browseSounds(): Promise<string[]> {
        return await ipcRenderer.invoke(getFromRenderer("browseSounds")) as string[];
    },
    async browseFolder(): Promise<string> {
        return await ipcRenderer.invoke(getFromRenderer("browseFolder")) as Promise<string>;
    },
    async getValidSoundPaths(paths: Iterator<string>): Promise<string[]> {
        return await ipcRenderer.invoke(getFromRenderer("getValidSoundPaths"), paths) as string[];
    },
    async isPathValid(path: string, type: "sound" | "folder"): Promise<boolean> {
        return await ipcRenderer.invoke(getFromRenderer("isPathValid"), path, type) as boolean;
    },
    async getSoundboards(): Promise<Soundboard[]> {
        return await ipcRenderer.invoke(getFromRenderer("getSoundboards")) as Soundboard[];
    },
    async getDevices(): Promise<MediaDeviceInfo[]> {
        return await ipcRenderer.invoke(getFromRenderer("getDevices")) as MediaDeviceInfo[];
    },
    async getInitialSelectedDevices(): Promise<MediaDeviceInfo[]> {
        return await ipcRenderer.invoke(getFromRenderer("getInitialSelectedDevices")) as MediaDeviceInfo[];
    },
    async shouldShowChangelog(): Promise<boolean> {
        return await ipcRenderer.invoke(getFromRenderer("shouldShowChangeLog")) as boolean;
    },
    async getInitialSoundboardIndex(): Promise<number> {
        return await ipcRenderer.invoke(getFromRenderer("getInitialSoundboardIndex")) as number;
    },
    async getNameFromPath(path: string): Promise<string> {
        return await ipcRenderer.invoke(getFromRenderer("getNameFromPath"), path) as string;
    },
    async getSettings(): Promise<Settings> {
        return await ipcRenderer.invoke(getFromRenderer("getSettings")) as Settings;
    },
    async getVersion(): Promise<string> {
        return await ipcRenderer.invoke(getFromRenderer("getVersion")) as string;
    },
    async getNewsHtml(): Promise<string> {
        return await ipcRenderer.invoke(getFromRenderer("getNews")) as string;
    },
    async startKeyRecordingSession(): Promise<string> {
        return await ipcRenderer.invoke(getFromRenderer("startKeyRecordingSession")) as string;
    },
});

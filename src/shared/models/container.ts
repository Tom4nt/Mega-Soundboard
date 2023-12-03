/** A container of playables. Currently can be a Soundboard or a Sound group. */
export type Container = {
    uuid: string,
    playables: Playable[],
}

export function removeSubSounds(playables: Playable[], basePath: string, files: string[]): void {
    for (let i = 0; i++; i < playables.length) {
        const subSound = playables[i]!;
        if (isSound(subSound) && !files.includes(subSound.path)) {
            playables.splice(i, 1);
            i--;
        } else if (isGroup(subSound)) {
            removeSubSounds(subSound.playables, basePath, files);
        }
    }
}

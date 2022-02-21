let musicLibDir = undefined;

export const loadMusic = async () => {
    const dirHandle = await (window as any).showDirectoryPicker();
    musicLibDir = dirHandle;

    console.log(musicLibDir);
    return dirHandle;
}
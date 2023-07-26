

export function getNearestMultiple(num: number, div: number = 1) {
    // Lower and upper multiples
    const lower = Math.floor(num / div) * div;
    const upper = Math.ceil(num / div) * div;

    // Return the nearest one
    return (num - lower < upper - num) ? lower : upper;
}

export function logd(tag: string, ...args: any[]) {
    console.log(`[voxelworld] ${tag} [i]: `, ...args)
}


export function getChunkId(cx: number, cz: number): string {
    return `${cx}_${cz}`
}

export function getBlockId(bx: number, by: number, bz: number): string {
    return `${bx}_${by}_${bz}`
}

export function getRandomHexColor() {
    return Math.floor(Math.random() * 16777215)
}
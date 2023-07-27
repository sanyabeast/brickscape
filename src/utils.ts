

export function getNearestMultiple(num: number, div: number = 1) {
    // Lower and upper multiples
    const lower = Math.floor(num / div) * div;
    const upper = Math.ceil(num / div) * div;

    // Return the nearest one
    return (num - lower < upper - num) ? lower : upper;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
}

export function logd(tag: string, ...args: any[]) {
    console.log(`[voxelworld] ${tag} [i]: `, ...args)
}


export function getChunkId(cx: number, cz: number): string {
    return `${cx}_${cz}`
}

export function getBlockId(bx: number, by: number, bz: number): string {
    return `${Math.round(bx)}_${Math.round(by)}_${Math.round(bz)}`
}

export function getRandomHexColor() {
    return Math.floor(Math.random() * 16777215)
}

export function distance(ax, ay, bx, by): number {
    return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2))
}
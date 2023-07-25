

export function getNearestMultiple(num: number, div: number = 1) {
    // Lower and upper multiples
    const lower = Math.floor(num / div) * div;
    const upper = Math.ceil(num / div) * div;

    // Return the nearest one
    return (num - lower < upper - num) ? lower : upper;
}

export function logd(tag: String, ...args: any[]) {
    console.log(`[voxelworld] ${tag} [i]: `, ...args)
}

export function SeededRandom(seed) {
    const m = 0x80000000; // 2**31;
    const a = 1103515245;
    const c = 12345;

    seed = seed || Math.floor(Math.random() * m);

    return function () {
        seed = (a * seed + c) % m;
        return seed / m;
    };
}

export function getChunkId(cx: number, cz: number): String {
    return `${cx}_${cz}`
}

export function getBlockId(bx: number, by: number, bz: number): String {
    return `${bx}_${by}_${bz}`
}

export class PerlinNoise {
    seed = null
    constructor(seed) {
        this.seed = seed
    }

    getNoiseValue({ x, y, scale, distortion }) {
        return 1;
    }
}

export class Sine {
    seed = null
    constructor(seed) {
        this.seed = seed
    }

    getNoiseValue({ x, y, scale = 1, iterations = 2 }) {
        
        let v = 0;

        for (let i = 0; i < iterations; i++){
            let iterationDivider = i + 1;
            let a = (Math.sin(x * (scale * iterationDivider)) + 1) / 2;
            let b = (Math.sin(y * (scale * iterationDivider)) + 1) / 2;

            v += (a * b);
        }

        return v / iterations;
    }
}

export function getRandomHexColor() {
    return Math.floor(Math.random() * 16777215)
}
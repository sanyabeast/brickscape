

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


export class Sine {
    seed = null
    constructor(seed) {
        this.seed = seed
    }

    getNoiseValue({ x, y, scale = 1, iterations = 2 }) {

        let v = 0;

        for (let i = 0; i < iterations; i++) {
            let iterationDivider = i + 1;
            let a = (Math.sin(x * (scale * iterationDivider)) + 1) / 2;
            let b = (Math.sin(y * (scale * iterationDivider)) + 1) / 2;

            v += (a * b);
        }

        return v / iterations;
    }
}


export class VoxelWorldGenerator {
    seed = null
    sine: Sine = null
    constructor(seed) {
        this.seed = seed
        this.sine = new Sine(seed)
    }
}
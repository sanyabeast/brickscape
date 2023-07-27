

import { perlin3D } from '@leodeslf/perlin-noise';

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
        return this.getPerlin3DNoise({ x, y })
    }

    getPerlin3DNoise({ x, y, iterations = 4 }) {
        let val = 0;

        for (let i = 0; i < iterations; i++) {
            const stepScale = 10 * Math.pow(2, i);
            const valueScale = 1 + Math.pow(2, i);
            val = (val + Math.abs(perlin3D(x / stepScale, y / stepScale, this.seed / stepScale) * valueScale)) / 2
        }

        val /= iterations

        return val
    }

    getSineNoise({ x, y, scale = 1, iterations = 2 }) {
        let val = 0;

        for (let i = 0; i < iterations; i++) {
            let iterationDivider = i + 1;
            let a = (Math.sin(x * (scale * iterationDivider)) + 1) / 2;
            let b = (Math.sin(y * (scale * iterationDivider)) + 1) / 2;

            val += (a * b);
        }
        return val / iterations;
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
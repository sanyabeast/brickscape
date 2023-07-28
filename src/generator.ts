

import { perlin3D, perlin4D } from '@leodeslf/perlin-noise';
import { clamp } from 'lodash';

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
    getSineNoise({ x, y, scale = 1, iterations = 2 }) {
        let val = 0;

        for (let i = 0; i < iterations; i++) {
            let iterationDivider = i + 1;
            let a = (Math.sin(x * (scale * iterationDivider)) + 1) / 2;
            let b = (Math.sin(y * (scale * iterationDivider)) + 1) / 2;

            val += (a * b);
        }
        return clamp(val / iterations, 0, 1);
    }
}

export class VoxelWorldGenerator {
    seed = null
    sine: Sine = null
    _seededRandom = null;;
    constructor(seed) {
        this.seed = seed
        this._seededRandom = SeededRandom(seed)
        this.sine = new Sine(seed)
    }

    random() {
        return this._seededRandom()
    }

    getPerlin3DNoise({ x, y, iterations = 4 }) {
        let val = 0;

        for (let i = 0; i < iterations; i++) {
            const stepScale = 10 * Math.pow(2, i);
            const valueScale = 1 + Math.pow(2, i);
            val = (val + Math.abs(perlin3D(x / stepScale, y / stepScale, this.seed / stepScale) * valueScale)) / 2
        }

        val /= (iterations / 2)

        return clamp(val, 0, 1)
    }

    getPerlin4DNoise({ x, y, z, iterations = 4 }) {
        let val = 0;

        for (let i = 0; i < iterations; i++) {
            const stepScale = 10 * Math.pow(2, i);
            const valueScale = 1 + Math.pow(2, i);
            val = (val + Math.abs(perlin4D(x / stepScale, y / stepScale, z / stepScale, this.seed / stepScale) * valueScale)) / 2
        }

        val /= (iterations)

        return clamp(val, 0, 1)
    }


    getNoiseValue({ x, y, scale = 1, iterations = 2 }) {
        return this.getPerlin3DNoise({ x, y })
    }


}
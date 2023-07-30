

import { perlin3D, perlin4D } from '@leodeslf/perlin-noise';
import { clamp } from 'lodash';
import { state } from './state';
import { IBlockCreationSourceParams } from './rules';

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

export class GenerationHelper {
    seed = null
    _seededRandom = null;;
    constructor(seed) {
        this.seed = seed
        this._seededRandom = SeededRandom(seed)
    }

    random() {
        return this._seededRandom()
    }

    dice(bias: number = 0.5) {
        return this.random() > bias
    }

    // getPerlin3DNoise(x, y, z, params: IBlockCreationSourceParams) {
    //     let val = 0;

    //     for (let i = 0; i < params.iterations; i++) {
    //         const stepScale = 10 * Math.pow(2, i);
    //         const valueScale = 1 + Math.pow(2, i);
    //         val = (val + Math.abs(perlin3D(x / stepScale, y / stepScale, this.seed / stepScale) * valueScale)) / 2
    //     }

    //     val /= (params.iterations / 100)
    //     val = clamp(val, 0, 1);

    //     console.log(val)
    //     return val
    // }

    getPerlin3DNoise(x, y, z, params: IBlockCreationSourceParams) {
        let val = 0;

        for (let i = 0; i < params.paramA; i++) {
            let iterationVal = perlin3D(
                x * params.paramB * (i + 1),
                y * params.paramB * (i + 1),
                (this.seed + params.paramD) * params.paramB * (i + 1)
            ) * params.paramC
            iterationVal = (iterationVal + 0.5)
            val += iterationVal
        }

        val /= params.paramA

        // console.log(val)
        return val
    }

    getPerlin4DNoise(x, y, z, params: IBlockCreationSourceParams) {
        let val = 0;

        for (let i = 0; i < params.paramA; i++) {
            let iterationVal = perlin4D(
                x * params.paramB * (i + 1),
                y * params.paramB * (i + 1),
                z * params.paramB * (i + 1),
                (this.seed + params.paramD) * params.paramB * (i + 1),
            ) * params.paramC
            iterationVal = (iterationVal + 0.5)
            val += iterationVal
        }

        val /= params.paramA

        return val
    }
}

export const generationHelper = new GenerationHelper(state.seed)
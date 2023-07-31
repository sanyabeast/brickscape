

import { state } from './state';
import { IBlockCreationSourceParams } from './rules';
import Alea from 'alea'
import { NoiseFunction2D, NoiseFunction3D, NoiseFunction4D, createNoise2D, createNoise3D, createNoise4D } from 'simplex-noise';
import { isNumber } from 'lodash';
import { perlin3D } from '@leodeslf/perlin-noise'
import { clamp } from './utils';

const _noiseSeedMultipier = 0.12345678

export class GenerationHelper {

    _seed: number = 0

    _simplex2D: NoiseFunction2D
    _simplex3D: NoiseFunction3D

    _alea: () => number

    constructor(seed: number) {
        this._seed = seed
        this._alea = Alea(seed.toString())
        this._simplex2D = createNoise2D(this._alea)
        this._simplex3D = createNoise3D(this._alea)
    }
    random() {
        return this._alea()
    }

    dice(bias: number = 0.5) {
        return this.random() > bias
    }

    simplex(x: number, y: number, params: IBlockCreationSourceParams): number {
        let s = isNumber(params.scale) ? params.scale : 1
        let seed = isNumber(params.seed) ? (params.seed * _noiseSeedMultipier) : 0
        let addent = isNumber(params.addent) ? params.addent : 0
        let v = this._simplex3D(x * s, y * s, seed)

        let iterations = isNumber(params.iterations) ? params.iterations : 0
        let scaleStep = isNumber(params.scaleStep) ? params.scaleStep : 0.5
        let multiplier = isNumber(params.multiplier) ? params.multiplier : 1

        for (let i = 0; i < iterations; i++) {
            s *= scaleStep
            v += this._simplex3D(x * s, y * s, seed)
        }

        v /= (iterations + 1)
        v += addent
        v *= multiplier

        return clamp(v, 0, 1)
    }

    perlin(x: number, y: number, params: IBlockCreationSourceParams): number {
        let s = isNumber(params.scale) ? params.scale : 1
        let seed = isNumber(params.seed) ? (params.seed * _noiseSeedMultipier) : 0
        let addent = isNumber(params.addent) ? params.addent : 0
        let v = perlin3D(x * s, y * s, this._seed + seed)

        let iterations = isNumber(params.iterations) ? params.iterations : 0
        let scaleStep = isNumber(params.scaleStep) ? params.scaleStep : 0.5
        let multiplier = isNumber(params.multiplier) ? params.multiplier : 1

        for (let i = 0; i < iterations; i++) {
            s *= scaleStep
            v = (v + perlin3D(x * s, y * s, this._seed + seed)) / 2
        }

        v += 0.5
        v += addent
        v *= multiplier

        return clamp(v, 0, 1)
    }
}

export const generationHelper = new GenerationHelper(state.seed)


import { state } from './state';
import { IBlockCreationSourceParams } from './rules';
import Alea from 'alea'
import { NoiseFunction2D, NoiseFunction3D, NoiseFunction4D, createNoise2D, createNoise3D, createNoise4D } from 'simplex-noise';
import { isNumber } from 'lodash';

export class GenerationHelper {
    seed: string

    simplex2D: NoiseFunction2D
    simplex3D: NoiseFunction3D
    simplex4D: NoiseFunction4D

    alea: () => number
    constructor(seed: string) {
        this.alea = Alea(seed)
        this.simplex2D = createNoise2D(this.alea)
        this.simplex3D = createNoise3D(this.alea)
        this.simplex4D = createNoise4D(this.alea)
    }

    random() {
        return this.alea()
    }

    dice(bias: number = 0.5) {
        return this.random() > bias
    }

    createSimplex2D(x: number, y: number, z: number, params: IBlockCreationSourceParams): number {
        let s = isNumber(params.scale) ? params.scale : 1
        let v = this.simplex2D(x * s, y * s)
        let iterations = isNumber(params.iterations) ? params.iterations : 0
        let scaleStep = isNumber(params.scaleStep) ? params.scaleStep : 0.5

        for (let i = 0; i < iterations; i++) {
            s /= scaleStep
            v += this.simplex2D(x * s, y * s)
        }

        v /= (iterations + 1)

        return v
    }

    createSimplex3D(x: number, y: number, z: number, params: IBlockCreationSourceParams): number {
        let s = isNumber(params.scale) ? params.scale : 1
        let v = this.simplex3D(x * s, y * s, z * s)

        let iterations = isNumber(params.iterations) ? params.iterations : 0
        let scaleStep = isNumber(params.scaleStep) ? params.scaleStep : 0.5

        for (let i = 0; i < iterations; i++) {
            s /= scaleStep
            v += this.simplex3D(x * s, y * s, z * s)
        }

        v /= (iterations + 1)

        return v
    }

    createSimplex4D(x: number, y: number, z: number, params: IBlockCreationSourceParams): number {
        let s = isNumber(params.scale) ? params.scale : 1
        let t = isNumber(params.time) ? params.time : 1
        let v = this.simplex3D(x * s, y * s, z * s)

        let iterations = isNumber(params.iterations) ? params.iterations : 0
        let scaleStep = isNumber(params.scaleStep) ? params.scaleStep : 0.5

        for (let i = 0; i < iterations; i++) {
            s /= scaleStep
            v += this.simplex4D(x * s, y * s, z * s, t)
        }

        v /= (iterations + 1)

        return v
    }
}

export const generationHelper = new GenerationHelper(state.seed)
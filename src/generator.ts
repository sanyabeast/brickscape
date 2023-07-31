

import { state } from './state';
import { IBlockCreationSourceParams } from './rules';
import Alea from 'alea'
import { NoiseFunction2D, NoiseFunction3D, NoiseFunction4D, createNoise2D, createNoise3D, createNoise4D } from 'simplex-noise';
import { isNumber } from 'lodash';
import { textureLoader } from './loaders';
import { getPixelBrightness, getPixelBrightness2, waitForCallback } from './utils';
import { Texture } from 'three';

let perlinTexture32_1: Texture = null
let voronoTextureA: Text

export class GenerationHelper {
    static async init() {
        await waitForCallback((resolve) => {
            perlinTexture32_1 = textureLoader.load('assets/noise/perlin.32_1.png', resolve)
        })

        await waitForCallback((resolve) => {
            perlinTexture32_1 = textureLoader.load('assets/noise/voronoi_a.png', resolve)
        })

        console.log(perlinTexture32_1)
    }

    seed: number = 0

    simplex2D: NoiseFunction2D
    simplex3D: NoiseFunction3D
    simplex4D: NoiseFunction4D

    alea: () => number

    constructor(seed: number) {
        this.seed = seed
        this.alea = Alea(seed.toString())
        this.simplex2D = createNoise2D(this.alea)
        this.simplex3D = createNoise3D(this.alea)
        this.simplex4D = createNoise4D(this.alea)
    }

    _getTextureValue2D(texture: Texture, seed, x, y) {
        let img = texture.source.data
        let width = img.width
        let height = img.height
        let offsetX = (this.seed + seed) % width
        let offsetY = Math.floor((this.seed + seed) / width)
        let px = ((x / 1) + offsetX) % width
        let py = ((y / 1) + offsetY) % height
        let brightness = getPixelBrightness2(texture.source.data, px, py)
        // console.log('gen', px, py, brightness)

        return brightness
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

    createPerlin4D(x: number, y: number, z: number, params: IBlockCreationSourceParams): number {
        let textureValue = this._getTextureValue2D(perlinTexture32_1, 0, x, z)
        console.log(textureValue)
        // let s = isNumber(params.scale) ? params.scale : 1
        // let t = isNumber(params.time) ? params.time : 1
        // let v = this.simplex3D(x * s, y * s, z * s)

        // let iterations = isNumber(params.iterations) ? params.iterations : 0
        // let scaleStep = isNumber(params.scaleStep) ? params.scaleStep : 0.5

        // for (let i = 0; i < iterations; i++) {
        //     s /= scaleStep
        //     v += this.simplex4D(x * s, y * s, z * s, t)
        // }

        // v /= (iterations + 1)

        // return v
        return 1
    }
}

export const generationHelper = new GenerationHelper(state.seed)
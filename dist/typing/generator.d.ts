import { IBlockCreationSourceParams } from './rules';
import { NoiseFunction2D, NoiseFunction3D } from 'simplex-noise';
export declare class GenerationHelper {
    _seed: number;
    _simplex2D: NoiseFunction2D;
    _simplex3D: NoiseFunction3D;
    _alea: () => number;
    constructor(seed: number);
    random(): number;
    dice(bias?: number): boolean;
    simplex(x: number, y: number, params: IBlockCreationSourceParams): number;
    perlin(x: number, y: number, params: IBlockCreationSourceParams): number;
}
export declare const generationHelper: GenerationHelper;

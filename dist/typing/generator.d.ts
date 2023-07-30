import { IBlockCreationSourceParams } from './rules';
export declare function SeededRandom(seed: any): () => number;
export declare class GenerationHelper {
    seed: any;
    _seededRandom: any;
    constructor(seed: any);
    random(): any;
    dice(bias?: number): boolean;
    getPerlin3DNoise(x: any, y: any, z: any, params: IBlockCreationSourceParams): number;
    getPerlin4DNoise(x: any, y: any, z: any, params: IBlockCreationSourceParams): number;
}
export declare const generationHelper: GenerationHelper;

export declare function SeededRandom(seed: any): () => number;
export declare class Sine {
    seed: any;
    constructor(seed: any);
    getSineNoise({ x, y, scale, iterations }: {
        x: any;
        y: any;
        scale?: number;
        iterations?: number;
    }): number;
}
export declare class VoxelWorldGenerator {
    seed: any;
    sine: Sine;
    _seededRandom: any;
    constructor(seed: any);
    random(): any;
    getPerlin3DNoise({ x, y, iterations }: {
        x: any;
        y: any;
        iterations?: number;
    }): number;
    getPerlin4DNoise({ x, y, z, iterations }: {
        x: any;
        y: any;
        z: any;
        iterations?: number;
    }): number;
    getNoiseValue({ x, y, scale, iterations }: {
        x: any;
        y: any;
        scale?: number;
        iterations?: number;
    }): number;
}

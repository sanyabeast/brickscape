import { InstancedBufferGeometry } from "three";
export type FSiblingIteratee = (dx: number, dy: number, dz: number, sibling: Block) => void;
export type FBlocksGridIteratee = (x: number, y: number, z: number, block?: Block) => void;
export type FBlocksGridIterateeXZ = (x: number, z: number) => void;
export type FChunkGridIteratee = (x: number, y: number, z: number, block?: Block) => void;
export type FChunkGridIterateeXZ = (x: number, z: number) => void;
export declare enum BlockShape {
    Cube = 0,
    Prism6 = 1
}
export declare enum BlockType {
    None = 0,
    Gravel = 1,
    Rock = 2,
    Dirt = 3,
    Sand = 4,
    Bedrock = 5,
    Water = 6
}
export interface IBlockTable {
    [x: string]: {
        tile: number[];
    };
}
export declare const blockTable: IBlockTable;
export declare class Block {
    static getShapeGeometry(): InstancedBufferGeometry;
    bx: number;
    by: number;
    bz: number;
    bid: string;
    btype: BlockType;
    lightness: number;
    serial: number;
    needsUpdate: boolean;
    get tileX(): number;
    get tileY(): number;
    constructor({ x, y, z, chunk, lightness, blockType }: {
        x: any;
        y: any;
        z: any;
        chunk: any;
        lightness: any;
        blockType: any;
    });
    kill(): void;
    iterateSiblings(distance: number, iteratee: FSiblingIteratee): void;
    update({ lightness, blockType }: {
        lightness: any;
        blockType: any;
    }): boolean;
}
export declare class BlockManager {
    static instance: BlockManager;
    static getInstance(): BlockManager;
    blocks: {
        [x: string]: Block;
    };
    constructor();
    setBlock(block: Block): void;
    removeBlock(block: Block): void;
    getBlockAt(x: number, y: number, z: number): Block;
    getBlockId(...args: number[]): string;
    getMostElevatedBlockAt(x: number, z: number): Block;
    getElevationAt(x: number, z: number): number;
    get maxBlocksPerChunk(): number;
    iterateGridXZ(fx: number, fz: number, tx: number, tz: number, iteratee: FBlocksGridIterateeXZ): void;
    traverseChunk(cx: number, cz: number, iteratee: FChunkGridIteratee): void;
    traverseChunk2D(cx: number, cz: number, iteratee: FChunkGridIterateeXZ): void;
    markBlocksUpdated(cx: number, cz: number): void;
    countBlocksNeedUpdate(cx: number, cz: number): number;
}
export declare const blockManager: BlockManager;

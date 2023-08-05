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
    Bedrock = 1,
    Gravel = 2,
    Rock = 3,
    Dirt = 4,
    Sand = 5,
    Water = 6,
    Pumpkin = 7,
    Wood = 8,
    Leaves = 9,
    Grass = 10,
    Bamboo = 11
}
export interface IBlockDescriptor {
    tile: number[];
    light?: boolean;
    animation?: boolean;
    tangibility: number;
}
export interface IBlockTable {
    [x: string]: IBlockDescriptor;
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
    get isLightSource(): boolean;
    get tangibility(): number;
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
    removeBlockAt(x: number, y: number, z: number): boolean;
    getBlockAt(x: number, y: number, z: number): Block;
    getBlockId(...args: number[]): string;
    getMostElevatedBlockAt(x: number, z: number): Block;
    getElevationAt(x: number, z: number): number;
    getElevationAtPosition(x: number, y: number, z: number, minTangibility?: number): number;
    getTangibilityAtPosition(x: number, y: number, z: number): number;
    get maxBlocksPerChunk(): number;
    iterateGridXZ(fx: number, fz: number, tx: number, tz: number, iteratee: FBlocksGridIterateeXZ): void;
    traverseChunk(cx: number, cz: number, iteratee: FChunkGridIteratee): void;
    traverseChunk2D(cx: number, cz: number, iteratee: FChunkGridIterateeXZ): void;
    markBlocksUpdated(cx: number, cz: number): void;
    countBlocksNeedUpdate(cx: number, cz: number): number;
}
export declare const blockManager: BlockManager;

import { InstancedBufferGeometry, Object3D } from "three";
export type FSiblingIteratee = (sibling: Block, dx: number, dy: number, dz: number) => void;
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
        type: BlockType;
        tile: number[];
        generate?: boolean;
        levels?: number[];
        rate?: number;
        replace?: boolean;
        order?: number;
    };
}
export declare const blockTable: IBlockTable;
export declare class Block extends Object3D {
    static getShapeGeometry(): InstancedBufferGeometry;
    bx: number;
    by: number;
    bz: number;
    bid: string;
    btype: BlockType;
    instanceIndex: number;
    lightness: number;
    lastUpdate: number;
    serial: number;
    get age(): number;
    get isOutdated(): boolean;
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
export declare class BlocksManager {
    static blocks: {
        [x: string]: Block;
    };
    static getBlockId(bx: number, by: number, bz: number): string;
    static getMostElevatedBlockAt(x: number, z: number): Block;
    static getElevationAt(x: number, z: number): number;
    static getBlockAt(x: number, y: number, z: number): Block;
    static getInstanceIndex(x: any, y: any, z: any): number;
    static get maxBlocksPerChunk(): number;
}

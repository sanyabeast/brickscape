import { Group, InstancedMesh, Object3D, InstancedBufferGeometry, InstancedBufferAttribute } from "three";
import { Task } from "./tasker";
declare enum BlockType {
    None = 0,
    Gravel = 1,
    Rock = 2,
    Dirt = 3,
    Sand = 4
}
export type FSiblingIteratee = (sibling: Block, dx: number, dy: number, dz: number) => void;
export declare class Block extends Object3D {
    static getShapeGeometry(): InstancedBufferGeometry;
    bx: number;
    by: number;
    bz: number;
    bid: string;
    btype: BlockType;
    instanceIndex: number;
    lightness: number;
    get tileX(): number;
    get tileY(): number;
    constructor({ x, y, z, chunk }: {
        x: any;
        y: any;
        z: any;
        chunk: any;
    });
    kill(): void;
    iterateSiblings(distance: number, iteratee: FSiblingIteratee): void;
}
export declare class Chunk extends Group {
    cid: string;
    cx: number;
    cz: number;
    serial: number;
    active: boolean;
    blocks: Block[];
    instanced: InstancedMesh[];
    _buildTask: Task;
    _built: boolean;
    _instancedBlockGeometry: InstancedBufferGeometry;
    _instancedAttribute: InstancedBufferAttribute;
    _instancedMesh: InstancedMesh;
    _noiseTable: {
        [x: string]: number;
    };
    constructor({ cx, cz }: {
        cx: any;
        cz: any;
    });
    _initBlockGeometry(): void;
    refresh(): void;
    updateBlocks(): void;
    updateChunkMatrix(): void;
    _buildChunk(): void;
    _generateInstancedMeshes(): void;
    _updateBlocksTypes(): void;
    _updateBlocksShading(): void;
    _updateInstancedAttributes(): void;
    update(): void;
    isSameChunk(cx: any, cz: any): boolean;
    snooze(): void;
    kill(): void;
    toString(): string;
}
export {};

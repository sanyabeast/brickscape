import { Group, InstancedMesh, InstancedBufferGeometry, InstancedBufferAttribute } from "three";
import { Task } from "./tasker";
import { Block } from "./blocks";
export type FChunkGridIteratee = (x: number, y: number, z: number, instanceIndex: number, block?: Block) => void;
export type FChunkGridIterateeXZ = (x: number, z: number) => void;
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
    lastUpdate: number;
    get age(): number;
    constructor({ cx, cz }: {
        cx: any;
        cz: any;
    });
    _initBlockGeometry(): void;
    update(): void;
    updateChunk(): void;
    _getOutdatedBlocksCount(): number;
    _updateChunkMatrix(): void;
    _buildChunk(): void;
    _updateBlocksTypes(): boolean;
    _updateBlocksShading(): boolean;
    _iterateChunkGrid(iteratee: FChunkGridIteratee): void;
    _iterateChunkGridXZ(iteratee: FChunkGridIterateeXZ): void;
    _generateInstancedMeshes(): void;
    _updateInstancedAttributes(): void;
    cancel(): void;
    kill(): void;
    toString(): string;
}

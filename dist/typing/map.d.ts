import { Group, Vector3 } from "three";
import { Chunk } from "./chunk";
export declare function getCameraLookIntersection(camera: any): Vector3;
export declare class VoxelMap extends Group {
    camera: any;
    activeChunk: any;
    chunks: {
        [x: string]: Chunk;
    };
    constructor({ camera }: {
        camera: any;
    });
    update(): void;
    _updateChunks(): void;
    _updateBlocks(): void;
    _trimOldChunks(leftCount?: number): void;
    _updateChunk(cx: number, cz: number): Chunk;
}

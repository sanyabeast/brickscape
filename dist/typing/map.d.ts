import { Group, Vector3 } from "three";
import { Chunk } from "./chunk";
export declare function getCameraLookIntersection(camera: any): Vector3;
export declare class MapManager extends Group {
    camera: any;
    activeChunk: any;
    _activeChunks: Chunk[];
    constructor({ camera }: {
        camera: any;
    });
    update(): void;
    _syncChunks(allChunks?: boolean): void;
    _onActiveChunkChanged(): void;
}

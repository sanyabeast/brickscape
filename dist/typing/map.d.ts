import { Group, Vector3 } from "three";
import { Chunk } from "./chunk";
/**
 * Get the intersection point of the camera's look direction with the ground plane.
 * @param {Camera} camera - The camera object to use for raycasting.
 * @returns {Vector3} - The intersection point of the ray and the ground plane.
 */
export declare function getCameraLookIntersection(camera: any): Vector3;
/**
 * A custom Group class representing the Map Manager which handles loading and unloading of chunks.
 */
export declare class MapManager extends Group {
    camera: any;
    activeChunk: any;
    _activeChunks: Chunk[];
    /**
     * Create a new Map Manager.
     * @param {Object} options - Options object containing the camera reference.
     */
    constructor({ camera }: {
        camera: any;
    });
    /**
     * Update the Map Manager.
     * This function should be called in the update/render loop to update the manager.
     */
    update(): void;
    /**
     * Synchronize the chunks with the world.
     * @param {boolean} allChunks - If true, sync all active chunks; otherwise, sync only updated chunks.
     */
    _syncChunks(allChunks?: boolean): void;
    /**
     * Handle the change of the active chunk.
     * This function is debounced to avoid rapid updates.
     */
    _onActiveChunkChanged(): void;
}

import { Group } from "three";
import { Chunk } from "./chunk";
/**
 * A custom Group class representing the Map Manager which handles loading and unloading of chunks.
 */
export declare class MapManager extends Group {
    activeChunk: number[];
    _activeChunks: Chunk[];
    /**
     * Create a new Map Manager.
     * @param {Object} options - Options object containing the camera reference.
     */
    constructor();
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

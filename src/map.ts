import { Group, Vector2, Vector3, Raycaster, Plane } from "three";
import { getNearestMultiple, logd } from "./utils";
import { FeatureLevel, featureLevel, state } from "./state"
import { Chunk } from "./chunk";
import { monitoringData } from "./gui";
import { worldManager } from "./world";
import { find, throttle } from "lodash";


// Chunk update rate limit in milliseconds
let _chunkUpdateRateLimit: number = (FeatureLevel.Low + 1) * 5;

// Chunk sync rate limit in milliseconds
let _chunkSyncRateLimit: number = (FeatureLevel.Low + 1) * 15;

/**
 * A custom Group class representing the Map Manager which handles loading and unloading of chunks.
 */
export class MapManager extends Group {
    activeChunk: number[] = null;
    _activeChunks: Chunk[];

    /**
     * Create a new Map Manager.
     * @param {Object} options - Options object containing the camera reference.
     */
    constructor() {
        super();
        this.activeChunk = [null, null];
        this._activeChunks = [];

        // Debounced function to handle the change of active chunk
        this._onActiveChunkChanged = throttle(this._onActiveChunkChanged.bind(this), 1000 / _chunkUpdateRateLimit);

        // Throttled function to sync the chunks
        this._syncChunks = throttle(this._syncChunks.bind(this), 1000 / _chunkSyncRateLimit);

        state.scene.add(this)
    }

    /**
     * Update the Map Manager.
     * This function should be called in the update/render loop to update the manager.
     */
    update() {
        let controlsAnchor = state.controls.getAnchorPosition()

        let cx = getNearestMultiple(controlsAnchor.x, state.chunkSize) / state.chunkSize;
        let cz = getNearestMultiple(controlsAnchor.z, state.chunkSize) / state.chunkSize;

        if (cx !== this.activeChunk[0] || cz != this.activeChunk[1]) {
            this.activeChunk[0] = cx;
            this.activeChunk[1] = cz;
            monitoringData.activeChunk = this.activeChunk.join(':');
            this._onActiveChunkChanged();
        }

        if (worldManager.needsUpdate) {
            this._syncChunks();
        }
    }

    /**
     * Synchronize the chunks with the world.
     * @param {boolean} allChunks - If true, sync all active chunks; otherwise, sync only updated chunks.
     */
    _syncChunks(allChunks: boolean = false) {
        if (allChunks) {
            this._activeChunks.forEach((chunk: Chunk) => chunk.sync());
        } else {
            let chunkToUpdate = worldManager.updatedChunks.pop();
            let cx = chunkToUpdate[0];
            let cz = chunkToUpdate[1];

            this._activeChunks.forEach((chunk: Chunk) => {
                if (cx === chunk.cx && cz === chunk.cz) {
                    chunk.sync();
                }
            });
        }
    }

    /**
     * Handle the change of the active chunk.
     * This function is debounced to avoid rapid updates.
     */
    _onActiveChunkChanged() {
        let cx = this.activeChunk[0];
        let cz = this.activeChunk[1];
        logd(`MapManager._onActiveChunkChanged`, `new active chunk: [${cx}, ${cz}]`);

        let visibleChunks: number[][] = [];
        for (let z = 0; z < state.drawChunks; z++) {
            for (let x = 0; x < state.drawChunks; x++) {
                if (x !== 0 && z !== 0) {
                    visibleChunks.push([cx + x, cz + z]);
                    visibleChunks.push([cx - x, cz + z]);
                    visibleChunks.push([cx + x, cz - z]);
                    visibleChunks.push([cx - x, cz - z]);
                } else if (x === 0 && z !== 0) {
                    visibleChunks.push([cx, cz + z]);
                    visibleChunks.push([cx, cz - z]);
                } else if (x !== 0 && z === 0) {
                    visibleChunks.push([cx + x, cz]);
                    visibleChunks.push([cx - x, cz]);
                } else {
                    visibleChunks.push([cx, cz]);
                }
            }
        }

        let chunksToLoad: number[][] = [];
        let chunksToUnload: Chunk[] = [];
        let newActiveChunks: Chunk[] = [];

        this._activeChunks.forEach((chunk: Chunk) => {
            if (find(visibleChunks, (indices) => {
                return chunk.cx === indices[0] && chunk.cz === indices[1];
            }) === undefined) {
                chunksToUnload.push(chunk);
            } else {
                newActiveChunks.push(chunk);
            }
        });

        visibleChunks.forEach((indices) => {
            if (find(this._activeChunks, (chunk) => chunk.cx === indices[0] && chunk.cz === indices[1]) === undefined) {
                chunksToLoad.push(indices);
            }
        });

        if (chunksToLoad.length === 0 && chunksToUnload.length === 0) {
            logd(`MapManager.__onActiveChunkChanged`, `nothing to load or unload`);
            return;
        }

        chunksToUnload.forEach(chunk => {
            Chunk.unload(chunk);
        });

        chunksToLoad.forEach((indices) => {
            let chunk = Chunk.load(indices[0], indices[1]);
            newActiveChunks.push(chunk);
        });

        this._activeChunks = newActiveChunks;
        this.children = this._activeChunks;
    }
}
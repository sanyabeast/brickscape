import { Group, GridHelper, Vector2, Vector3, Raycaster, Plane } from "three";
import { getChunkId, getNearestMultiple, logd } from "./utils";
import { state } from "./state"
import { Chunk } from "./chunk";
import { debounce, orderBy, sortBy, throttle, values } from "lodash";
import { QueueType } from "./tasker";


let _groundPlane = new Plane(new Vector3(0, 1, 0), 0);
let _intersection = new Vector3();
let _raycaster = new Raycaster();
let _radialChunksLoading = false
const maxChunkAge = 3

export function getCameraLookIntersection(camera) {
    // Create a Raycaster using the camera's current position and look direction

    _raycaster.setFromCamera(new Vector2(0, 0), camera);  // (0,0) corresponds to center of screen
    // Create a horizontal plane at y = 0
    // Upwards normal vector, 0 offset
    // Calculate intersection

    _raycaster.ray.intersectPlane(_groundPlane, _intersection);
    return _intersection;
}

export class VoxelMap extends Group {
    camera = null
    activeChunk = null

    chunks: {
        [x: string]: Chunk
    } = {}

    constructor({ camera }) {
        super();
        this.camera = camera
        this.activeChunk = [null, null]
        // GRID HELPER
        this.add(new GridHelper(5, 10, 0x888888, 0x444444))
        this._updateChunks = debounce(this._updateChunks.bind(this), 250)
        this._trimOldChunks = debounce(this._trimOldChunks.bind(this), 500)
        this._updateBlocks = throttle(this._updateBlocks.bind(this, 250))
    }
    update() {
        let cameraLook = getCameraLookIntersection(this.camera)
        // console.log(cameraLook)

        let cx = getNearestMultiple(cameraLook.x, state.chunkSize) / state.chunkSize
        let cz = getNearestMultiple(cameraLook.z, state.chunkSize) / state.chunkSize

        if (cx !== this.activeChunk[0] || cz != this.activeChunk[1]) {
            this.activeChunk[0] = cx
            this.activeChunk[1] = cz
            // logd('VoxelMap.update', 'active chunk changed', this.activeChunk)
            this._updateChunks();
            this._trimOldChunks(state.maxChunksInMemory)
        }

        this._updateBlocks()
    }

    _updateChunks() {
        let cx = this.activeChunk[0]
        let cz = this.activeChunk[1]


        for (let k in this.chunks) {
            this.chunks[k].active = false
        }

        let center = new Vector2(cx, cz);

        for (let z = cz - state.drawChunks; z <= cz + state.drawChunks; z++) {
            for (let x = cx - state.drawChunks; x <= cx + state.drawChunks; x++) {
                if (_radialChunksLoading) {
                    let chunkPos = new Vector2(x, z);
                    let distance = Math.floor(center.distanceTo(chunkPos));

                    if (distance < state.drawChunks) {
                        let chunk = this._updateChunk(x, z);
                        chunk.active = true;
                    }
                } else {
                    let chunk = this._updateChunk(x, z)
                    chunk.active = true
                }
            }
        }

        for (let k in this.chunks) {
            if (this.chunks[k].active) {
                // state.tasker.flush(['map', 'chunk-snooze', this.chunks[k].cid])
                this.add(this.chunks[k])
            } else {
                this.chunks[k].cancel()
                this.remove(this.chunks[k])
            }
        }

        this._updateBlocks()
    }

    _updateBlocks() {
        let _someChunkUpdated = false
        for (let k in this.chunks) {
            if (this.chunks[k].active && this.chunks[k].age > maxChunkAge) {
                _someChunkUpdated = true
                state.tasker.add((done) => {
                    if (this.chunks[k]) {
                        this.chunks[k].update()
                    }
                    setTimeout(done, 1)
                }, ['map', 'chunk', k, 'update-materials'], QueueType.Reversed, true)
            }

            if (_someChunkUpdated) {
                break
            }
        }
    }

    _trimOldChunks(leftCount: number = 128) {
        let sortedChunks = orderBy(values(this.chunks), (chunk) => chunk.serial, 'desc')

        let chunksToRemove = sortedChunks.slice(leftCount);
        chunksToRemove.forEach((chunk) => {
            chunk.kill()
            delete this.chunks[chunk.cid]
            this.remove(chunk)
        })

        if (chunksToRemove.length > 0) {
            console.log(`chunks removed: ${chunksToRemove.length}`)
        }
    }

    _updateChunk(cx: number, cz: number): Chunk {
        let chunkId = getChunkId(cx, cz)
        let chunk = this.chunks[chunkId]

        if (chunk === undefined) {
            chunk = this.chunks[chunkId] = new Chunk({
                cx,
                cz
            })
        } else {
            chunk.update()
        }

        return chunk
    }
}
import { Group, GridHelper, Vector2, Vector3, Raycaster, Plane } from "three";
import { getChunkId, getNearestMultiple, logd } from "./utils";
import { state } from "./state"
import { Chunk } from "./chunk";
import { debounce, orderBy, sortBy, throttle, values } from "lodash";


export function getCameraLookIntersection(camera) {
    // Create a Raycaster using the camera's current position and look direction
    let raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(0, 0), camera);  // (0,0) corresponds to center of screen
    // Create a horizontal plane at y = 0
    let groundPlane = new Plane(new Vector3(0, 1, 0), 0); // Upwards normal vector, 0 offset
    // Calculate intersection
    let intersection = new Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersection);
    return intersection;
}

export class VoxelMap extends Group {
    camera = null
    activeChunk = null


    constructor({ camera }) {
        super();
        this.camera = camera
        this.activeChunk = [null, null]
        // GRID HELPER
        this.add(new GridHelper(5, 10, 0x888888, 0x444444))
        this._updateChunks = throttle(this._updateChunks.bind(this), 250)
        this._trimOldChunks = debounce(this._trimOldChunks.bind(this), 500)
    }
    update() {
        let cameraLook = getCameraLookIntersection(this.camera)
        // console.log(cameraLook)

        let cx = getNearestMultiple(cameraLook.x, state.chunkSize) / state.chunkSize
        let cz = getNearestMultiple(cameraLook.z, state.chunkSize) / state.chunkSize

        if (cx !== this.activeChunk[0] || cz != this.activeChunk[1]) {
            this.activeChunk[0] = cx
            this.activeChunk[1] = cz
            logd('VoxelMap.update', 'active chunk changed', this.activeChunk)
            this._updateChunks();
            this._trimOldChunks()
        }
    }

    _updateChunks() {
        let cx = this.activeChunk[0]
        let cz = this.activeChunk[1]

        for (let k in state.chunks) {
            state.chunks[k].active = false
        }

        for (let y = cz - state.drawChunks; y <= cz + state.drawChunks; y++) {
            for (let x = cx - state.drawChunks; x <= cx + state.drawChunks; x++) {
                let chunk = this._updateChunk(x, y)
                chunk.active = true
            }
        }

        for (let k in state.chunks) {
            if (state.chunks[k].active) {
                this.add(state.chunks[k])
            } else {
                this.remove(state.chunks[k])
                state.tasker.flush([
                    'chunk',
                    state.chunks[k].chunkId
                ])
            }
        }
    }

    _trimOldChunks(leftCount: number = 128) {
        let sortedChunks = orderBy(values(state.chunks), (chunk) => chunk.serial, 'desc')
        sortedChunks.forEach(c => console.log(c.serial))

        let chunksToRemove = sortedChunks.slice(leftCount);
        chunksToRemove.forEach((chunk) => {
            state.tasker.flush(['chunk', chunk.chunkId])
            delete state.chunks[chunk.chunkId]
            this.remove(chunk)
            chunk.kill()
        })

        if (chunksToRemove.length > 0) {
            console.log(`chunks removed: ${chunksToRemove.length}`)
        }
    }

    _updateChunk(cx: number, cz: number): Chunk {
        let chunkId = getChunkId(cx, cz)
        let chunk = state.chunks[chunkId]

        if (chunk === undefined) {
            chunk = state.chunks[chunkId] = new Chunk({
                cx,
                cz
            })
        } else {
            chunk.refresh()
        }

        return chunk
    }
}
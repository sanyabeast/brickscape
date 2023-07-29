import { Group, GridHelper, Vector2, Vector3, Raycaster, Plane } from "three";
import { getChunkId, getNearestMultiple, logd } from "./utils";
import { state } from "./state"
import { Chunk } from "./chunk";
import { debounce, orderBy, sortBy, throttle, values } from "lodash";
import { QueueType } from "./tasker";
import { monitoringData } from "./gui";


let _groundPlane = new Plane(new Vector3(0, 1, 0), 0);
let _intersection = new Vector3();
let _raycaster = new Raycaster();
const maxChunkAge = 10

export function getCameraLookIntersection(camera) {
    // Create a Raycaster using the camera's current position and look direction

    _raycaster.setFromCamera(new Vector2(0, 0), camera);  // (0,0) corresponds to center of screen
    // Create a horizontal plane at y = 0
    // Upwards normal vector, 0 offset
    // Calculate intersection

    _raycaster.ray.intersectPlane(_groundPlane, _intersection);
    return _intersection;
}

export class WorldManager extends Group {
    camera = null
    activeChunk = null
    _generatedChunks: { [x: string]: boolean } = {}

    chunks: {
        [x: string]: Chunk
    } = {}

    constructor({ camera }) {
        super();
        this.camera = camera
        this.activeChunk = [null, null]
        // GRID HELPER
        this.add(new GridHelper(5, 10, 0x888888, 0x444444))
        this._updateChunks = debounce(this._updateChunks.bind(this), 1000)
        this._trimOldChunks = debounce(this._trimOldChunks.bind(this), 1000)
        this._updateBlocks = throttle(this._updateBlocks.bind(this, 1000))
    }
    update() {
        let cameraLook = getCameraLookIntersection(this.camera)
        // console.log(cameraLook)

        let cx = getNearestMultiple(cameraLook.x, state.chunkSize) / state.chunkSize
        let cz = getNearestMultiple(cameraLook.z, state.chunkSize) / state.chunkSize

        if (cx !== this.activeChunk[0] || cz != this.activeChunk[1]) {
            this.activeChunk[0] = cx
            this.activeChunk[1] = cz
            monitoringData.activeChunk = this.activeChunk.join(':')
            // logd('VoxelMap.update', 'active chunk changed', this.activeChunk)
            this._trimOldChunks(state.maxChunksInMemory)
            this._updateChunks();

        }

        // this._updateBlocks()
    }

    _updateChunks() {
        let cx = this.activeChunk[0]
        let cz = this.activeChunk[1]

        for (let k in this.chunks) {
            this.chunks[k].active = false
        }

        for (let z = 0; z < state.drawChunks; z++) {
            for (let x = 0; x < state.drawChunks; x++) {
                this._updateChunk(cx + x, cz + z, true)
                this._updateChunk(cx + -x, cz + z, true)
                this._updateChunk(cx + x, cz + -z, true)
                this._updateChunk(cx + -x, cz + -z, true)
            }
        }

        for (let k in this.chunks) {
            if (this.chunks[k].active) {
                // state.tasker.flush(['map', 'chunk-snooze', this.chunks[k].cid])
                if (!this.chunks[k].parent) {
                    this.add(this.chunks[k])
                }
            } else {
                if (this.chunks[k].parent) {
                    this.chunks[k].cancel()
                    this.remove(this.chunks[k])
                }
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

    _updateChunk(cx: number, cz: number, isActive: boolean): Chunk {
        let chunkId = getChunkId(cx, cz)
        let chunk = this.chunks[chunkId]

        if (this._generatedChunks[chunkId] !== true) {
            this._generateBlocks(cx, 0, cz, cx + state.chunkSize, state.worldHeight, cz + state.chunkSize)
        }

        if (chunk === undefined) {
            chunk = this.chunks[chunkId] = new Chunk({
                cx,
                cz
            })
        } else {
            chunk.update()
        }

        chunk.active = isActive

        return chunk
    }

    _generateBlocks(fx: number, fy: number, fz: number, tx: number, ty: number, tz: number) {
        // // bedrock level
        // this._iterateChunkGridXZ((x, z) => {
        //     new Block({
        //         chunk: this,
        //         x: x,
        //         y: 0,
        //         z: z,
        //         lightness: 1,
        //         blockType: BlockType.Bedrock
        //     })
        // })

        // // main perlin noise
        // this._iterateChunkGridXZ((x, z) => {
        //     let noiseValue = state.generator.getNoiseValue({
        //         x: x,
        //         y: z,
        //         scale: 0.01,
        //         iterations: 32
        //     })

        //     let heightValue = Math.floor(state.worldHeight * noiseValue) + 1

        //     for (let i = 1; i < heightValue - 1; i++) {
        //         new Block({
        //             chunk: this,
        //             x: x,
        //             y: i,
        //             z: z,
        //             lightness: 1,
        //             blockType: BlockType.None
        //         })
        //     }
        // })

        // // watering

        // let waterLevel = 2

        // this._iterateChunkGridXZ((x, z) => {
        //     let existingBlock = BlockManager.getBlockAt(x, waterLevel, z)
        //     if (!existingBlock) {
        //         new Block({
        //             chunk: this,
        //             x: x,
        //             y: waterLevel,
        //             z: z,
        //             lightness: 1,
        //             blockType: BlockType.Water
        //         })
        //     }
        // })
    }
}
import { Group, InstancedMesh, InstancedBufferGeometry, InstancedBufferAttribute } from "three"
import { dummy, getChunkId, lerp } from "./utils"
import { state } from "./state"
import { debounce, throttle } from "lodash"
import { VoxelBlockMaterial } from "./shaders"
import { QueueType, Task } from "./tasker"
import { Block, BlockType, BlocksManager } from "./blocks"


let _chunksCounter = 0;

export type FChunkGridIteratee = (x: number, y: number, z: number, instanceIndex: number, block?: Block) => void
export type FChunkGridIterateeXZ = (x: number, z: number) => void

export class Chunk extends Group {
    cid: string = null
    cx: number = null
    cz: number = null
    serial: number = null
    active: boolean = false
    blocks: Block[] = null
    instanced: InstancedMesh[] = null
    _buildTask: Task = null
    _built: boolean = false
    _instancedBlockGeometry: InstancedBufferGeometry = null
    _instancedAttribute: InstancedBufferAttribute = null
    _instancedMesh: InstancedMesh = null
    _noiseTable: { [x: string]: number }
    lastUpdate: number = 0

    get age() {
        return (+new Date() - this.lastUpdate) / 1000
    }

    constructor({ cx, cz }) {
        super()
        this.cx = cx
        this.cz = cz
        this.cid = getChunkId(cx, cz)
        this.serial = _chunksCounter
        _chunksCounter++
        this.blocks = []

        this._noiseTable = {}

        this.position.set(cx * state.chunkSize, 0, cz * state.chunkSize)
        this.matrixAutoUpdate = false

        this.visible = false

        this._updateChunkMatrix = throttle(this._updateChunkMatrix.bind(this), 1000 / 15)
        this.update = debounce(this.update.bind(this), 32)

        this.update()
    }

    _initBlockGeometry() {
        if (this._instancedBlockGeometry === null) {
            this._instancedBlockGeometry = new InstancedBufferGeometry().copy(Block.getShapeGeometry());
            let instanceIndices = new Float32Array(BlocksManager.maxBlocksPerChunk * 3 * 10)
            let attribute = this._instancedAttribute = new InstancedBufferAttribute(instanceIndices, 3);
            for (let i = 0; i < BlocksManager.maxBlocksPerChunk; i++) {
                attribute.setXYZ(i, 0, 0, 1);
            }
            this._instancedBlockGeometry.setAttribute('instanceData', attribute);
        }
    }

    update() {
        if (!this._built) {
            this._buildTask = state.tasker.add((done) => {
                this._built = true
                this._buildTask = null

                this._initBlockGeometry()
                this._buildChunk()
                this.updateChunk()

                this._updateChunkMatrix()
                this.visible = true

                done()
            }, ['chunk', this.cid], QueueType.Reversed)
        } else {
            this.updateChunk()
        }

    }

    updateChunk() {
        // console.log(`updating blocks at ${this.toString()}...`)
        if (this._built) {
            let outdatetBlocksCount = this._getOutdatedBlocksCount();

            if (outdatetBlocksCount > 0) {
                let shadingChanged = this._updateBlocksShading()
                let blockTypesChanged = this._updateBlocksTypes();

                if (shadingChanged || blockTypesChanged) {
                    this._updateInstancedAttributes()
                } else {
                    // console.log(`chunk have not changed since last update`)
                }

                this.lastUpdate = +new Date()
            } else {
                // console.log(`no outdated blocks`)
            }
        }
    }

    _getOutdatedBlocksCount(): number {
        let i = 0;
        this._iterateChunkGrid((x, y, z, instanceIndex, block) => {
            if (block && block.isOutdated) {
                i++
            }
        })
        return i
    }

    _updateChunkMatrix() {
        this._instancedMesh.instanceMatrix.needsUpdate = true
        this.updateMatrix()
    }

    _buildChunk() {
        // bedrock level
        this._iterateChunkGridXZ((x, z) => {
            new Block({
                chunk: this,
                x: x,
                y: 0,
                z: z,
                lightness: 1,
                blockType: BlockType.Bedrock
            })
        })

        // main perlin noise
        this._iterateChunkGridXZ((x, z) => {
            let noiseValue = state.generator.getNoiseValue({
                x: x,
                y: z,
                scale: 0.01,
                iterations: 32
            })

            let heightValue = Math.floor(state.worldHeight * noiseValue) + 1

            for (let i = 1; i < heightValue; i++) {
                new Block({
                    chunk: this,
                    x: x,
                    y: i,
                    z: z,
                    lightness: 1,
                    blockType: BlockType.None
                })
            }
        })

        // watering

        let waterLevel = 3

        this._iterateChunkGridXZ((x, z) => {
            let existingBlock = BlocksManager.getBlockAt(x, waterLevel, z)
            if (!existingBlock) {
                new Block({
                    chunk: this,
                    x: x,
                    y: waterLevel,
                    z: z,
                    lightness: 1,
                    blockType: BlockType.Water
                })
            }
        })


        this._generateInstancedMeshes()
    }

    _updateBlocksTypes(): boolean {
        let changed = false
        this._iterateChunkGrid((x, y, z, instanceIndex, block) => {
            if (block) {
                if (block.btype === BlockType.None) {
                    let blockType = BlockType.Dirt;
                    if (block.by < 8 && Math.random() > 0.8) {
                        blockType = BlockType.Rock
                    } else if (block.by < 6 && Math.random() > 0.9) {
                        blockType = BlockType.Gravel
                    } else if (block.by < 6) {
                        blockType = BlockType.Sand
                    }

                    let blockChanged = block.update({
                        lightness: block.lightness,
                        blockType
                    })

                    changed = changed || blockChanged
                }
            }
        })
        return changed
    }

    _updateBlocksShading() {
        let changed = false
        this._iterateChunkGrid((x, y, z, instanceIndex, block) => {
            if (block) {
                let lightness = 1
                let sibDistance = 2
                block.iterateSiblings(sibDistance, (block, dx, dy, dz) => {
                    let shadingFactor = 0
                    if (dy >= 1) {
                        shadingFactor += Math.pow((dy + sibDistance) / (sibDistance * 2), 1.5)
                        shadingFactor += Math.pow(Math.abs(dx) / sibDistance, 1.5)
                        shadingFactor += Math.pow(Math.abs(dy) / sibDistance, 1.5)
                        shadingFactor += Math.pow(Math.abs(dz) / sibDistance, 1.5)
                        shadingFactor /= 4
                    }
                    lightness *= lerp(1, 0.95, shadingFactor);
                })

                let blockChanged = block.update({
                    lightness,
                    blockType: block.btype
                })

                changed = changed || blockChanged
            }
        })
        return changed
    }


    _iterateChunkGrid(iteratee: FChunkGridIteratee) {
        for (let z = 0; z < state.chunkSize; z++) {
            for (let x = 0; x < state.chunkSize; x++) {
                for (let y = 0; y < state.worldHeight; y++) {
                    iteratee(x + (this.cx * state.chunkSize), y, z + (this.cz * state.chunkSize), BlocksManager.getInstanceIndex(x, y, z), BlocksManager.getBlockAt(x + (this.cx * state.chunkSize), y, z + (this.cz * state.chunkSize)))
                }
            }
        }
    }

    _iterateChunkGridXZ(iteratee: FChunkGridIterateeXZ) {
        for (let z = 0; z < state.chunkSize; z++) {
            for (let x = 0; x < state.chunkSize; x++) {
                iteratee(x + (this.cx * state.chunkSize), z + (this.cz * state.chunkSize))
            }
        }
    }

    _generateInstancedMeshes() {
        let material = new VoxelBlockMaterial({ color: 0xFFFFFF, maxInstances: BlocksManager.maxBlocksPerChunk, state })
        const instancedMesh = this._instancedMesh = new InstancedMesh(this._instancedBlockGeometry, material, BlocksManager.maxBlocksPerChunk);
        this._iterateChunkGrid((x, y, z, instanceIndex, block) => {
            if (block) {
                instancedMesh.setMatrixAt(instanceIndex, block.matrix);
            } else {
                instancedMesh.setMatrixAt(instanceIndex, dummy.matrix);
            }
        })

        this.add(instancedMesh)
    }

    _updateInstancedAttributes() {
        this._iterateChunkGrid((x, y, z, instanceIndex, block) => {
            if (block) {
                this._instancedAttribute.setXYZ(block.instanceIndex, block.tileX, block.tileY, block.lightness)
            }
        })

        this._instancedAttribute.needsUpdate = true
    }

    cancel() {
        if (this._buildTask) {
            this._buildTask.cancel()
            this._buildTask = null
        }
    }

    kill() {
        if (this._buildTask) {
            this._buildTask.cancel()
            this._buildTask = null
        }
        if (this._instancedBlockGeometry) {
            this._instancedBlockGeometry.dispose()
            delete this._instancedBlockGeometry
        }

    }

    override toString() {
        return `Chunk(cx=${this.cx}, cz=${this.cz})`
    }
}
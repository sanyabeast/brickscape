import { Group, InstancedMesh, InstancedBufferGeometry, InstancedBufferAttribute, Object3D, Material } from "three"
import { getChunkId, lerp } from "./utils"
import { state } from "./state"
import { debounce, throttle } from "lodash"
import { VoxelBlockStandardMaterial } from "./shaders"
import { QueueType, Task } from "./tasker"
import { Block, BlockShape, BlockType, BlocksManager } from "./blocks"


let _chunksCounter = 0;

export type FChunkGridIteratee = (x: number, y: number, z: number, instanceIndex: number, block?: Block) => void
export type FChunkGridIterateeXZ = (x: number, z: number) => void


let _instancedMesh = null
let _blockMaterial: Material = null


function _createInstancedMesh(): InstancedMesh {
    if (_instancedMesh === null) {
        const _instancedBlockGeometry = new InstancedBufferGeometry().copy(Block.getShapeGeometry());
        const _instanceDataArray = new Float32Array(BlocksManager.maxBlocksPerChunk * 3)
        const _instanceDataAttribute = new InstancedBufferAttribute(_instanceDataArray, 3);

        const _instanceVisibilityArray = new Float32Array(BlocksManager.maxBlocksPerChunk)
        const _instanceVisibilityAttribute = new InstancedBufferAttribute(_instanceVisibilityArray, 1);

        _blockMaterial = _blockMaterial || new VoxelBlockStandardMaterial({ color: 0xFFFFFF, maxInstances: BlocksManager.maxBlocksPerChunk, state })

        for (let i = 0; i < BlocksManager.maxBlocksPerChunk; i++) {
            _instanceDataAttribute.setXYZ(i, 0, 0, 1);
            _instanceVisibilityAttribute.setX(i, 0)
        }

        _instancedBlockGeometry.setAttribute('instanceData', _instanceDataAttribute);
        _instancedBlockGeometry.setAttribute('instanceVisibility', _instanceVisibilityAttribute);

        _instancedMesh = new InstancedMesh(_instancedBlockGeometry, _blockMaterial, BlocksManager.maxBlocksPerChunk);

        for (let x = 0; x < state.chunkSize; x++) {
            for (let z = 0; z < state.chunkSize; z++) {
                for (let y = 0; y < state.worldHeight; y++) {
                    let dummy = new Object3D()

                    switch (state.blockShape) {
                        case BlockShape.Prism6: {
                            let dx = x
                            if (z % 2 == 0) {
                                dx += 0.5
                            }
                            dummy.position.set(dx, y, z)
                            break;
                        }
                        default: {
                            dummy.position.set(x, y, z)
                        }
                    }
                    dummy.updateMatrix()
                    _instancedMesh.setMatrixAt(BlocksManager.getInstanceIndex(x, y, z), dummy.matrix)
                }
            }
        }

        _instancedMesh.matrixAutoUpdate = false
        _instancedMesh.updateMatrix()
        return _instancedMesh
    } else {

        let clonedInstancedMesh = _instancedMesh.clone()
        clonedInstancedMesh.geometry = _instancedMesh.geometry.clone()

        clonedInstancedMesh.matrixAutoUpdate = false
        clonedInstancedMesh.updateMatrix()
        return clonedInstancedMesh
    }
}


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
    _instanceDataAttribute: InstancedBufferAttribute = null
    _instanceVisibilityAttribute: InstancedBufferAttribute = null
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

    _initInstancedMesh() {

        if (this._instancedMesh === null) {
            this._instancedMesh = _createInstancedMesh()
            this._instanceDataAttribute = this._instancedMesh.geometry.attributes['instanceData'] as InstancedBufferAttribute
            this._instanceVisibilityAttribute = this._instancedMesh.geometry.attributes['instanceVisibility'] as InstancedBufferAttribute
            this.add(this._instancedMesh)
        }
    }

    update() {
        if (!this._built) {
            this._buildTask = state.tasker.add((done) => {
                this._built = true
                this._buildTask = null

                this._initInstancedMesh()
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

            for (let i = 1; i < heightValue - 1; i++) {
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

        let waterLevel = 2

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
                block.iterateSiblings(sibDistance, (dx, dy, dz, block) => {
                    if (block) {
                        let shadingFactor = 0
                        if (dy >= 1) {
                            shadingFactor += Math.pow((dy + sibDistance) / (sibDistance * 2), 1.5)
                            shadingFactor += Math.pow(Math.abs(dx) / sibDistance, 1.5)
                            shadingFactor += Math.pow(Math.abs(dy) / sibDistance, 1.5)
                            shadingFactor += Math.pow(Math.abs(dz) / sibDistance, 1.5)
                            shadingFactor /= 4
                        }
                        lightness *= lerp(1, 0.95, shadingFactor);
                    }
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

    _updateInstancedAttributes() {
        this._iterateChunkGrid((x, y, z, instanceIndex, block) => {
            if (block) {
                this._instanceVisibilityAttribute.setX(instanceIndex, 1)
                this._instanceDataAttribute.setXYZ(instanceIndex, block.tileX, block.tileY, block.lightness)
            } else {
                this._instanceVisibilityAttribute.setX(instanceIndex, 0)
            }
        })

        this._instanceDataAttribute.needsUpdate = true
    }


    kill() {
        this.cancel()

        if (this._instancedMesh) {
            this._instancedMesh.geometry.dispose()
        }
    }


    cancel() {
        if (this._buildTask) {
            this._buildTask.cancel()
            this._buildTask = null
        }
    }


    override toString() {
        return `Chunk(cx=${this.cx}, cz=${this.cz})`
    }
}
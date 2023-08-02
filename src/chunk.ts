import { Group, InstancedMesh, InstancedBufferGeometry, InstancedBufferAttribute, Object3D, Material, GridHelper } from "three"
import { logd } from "./utils"
import { state } from "./state"
import { getBlockBaseMaterial } from "./shaders"
import { Task } from "./tasker"
import { Block, BlockShape, blockManager, blockTable } from "./blocks"
import { worldManager } from "./world"
import { monitoringData } from "./gui"
import { debounce } from "lodash"

// Pool of chunk objects for reusability
const _chunkPool: Chunk[] = []

// Maximum size limit of the chunk pool
const _chunkPoolLimit = 100

/**
 * Represents a single chunk in the world.
 */
export class Chunk extends Group {

    static _chunksCounter = 0;
    static _baseInstancedMesh = null
    static _baseBlockMaterial: Material = null

    cx: number = null
    cz: number = null
    serial: number = null
    _buildTask: Task = null
    _built: boolean = false
    _instanceDataAttribute: InstancedBufferAttribute = null
    _instanceExtraDataAttribute: InstancedBufferAttribute = null
    _instancedMesh: InstancedMesh = null
    _gridHelper: GridHelper

    /**
     * The x-coordinate of the first block in the chunk.
     */
    get bx0() {
        return this.cx * state.chunkSize
    }

    /**
     * The z-coordinate of the first block in the chunk.
     */
    get bz0() {
        return this.cz * state.chunkSize
    }

    /**
     * Create a new Chunk object.
     * @param {Object} options - Options object containing the x and z coordinates of the chunk.
     */
    constructor({ cx, cz }) {
        logd('Chunk', `new [${cx}, ${cz}]}`)
        super()

        this.serial = Chunk._chunksCounter
        Chunk._chunksCounter++
        this.matrixAutoUpdate = false

        // Create instanced mesh for rendering blocks
        this._instancedMesh = Chunk._createInstancedMesh()
        this._instanceDataAttribute = this._instancedMesh.geometry.attributes['instanceData'] as InstancedBufferAttribute
        this._instanceExtraDataAttribute = this._instancedMesh.geometry.attributes['instanceExtraData'] as InstancedBufferAttribute
        this.add(this._instancedMesh)

        // Create grid helper for visual debugging
        this._gridHelper = new GridHelper(state.chunkSize, state.chunkSize, 0x999999, 0x999999)
        this._gridHelper.position.set(state.chunkSize / 2 - 0.5, 0, state.chunkSize / 2 - 0.5)
        this.add(this._gridHelper)
        this.setup(cx, cz)
        this._updateGeometry = debounce(this._updateGeometry.bind(this), 1000)
    }

    /**
     * Synchronize the chunk with the world.
     */
    sync() {
        logd('Chunk.sync', this.toString())
        this._updateGeometry(true)
    }

    /**
     * Update the geometry of the chunk.
     * @param {boolean} updateAttrs - Whether to update the attributes.
     */
    _updateGeometry(updateAttrs: boolean = false) {
        if (updateAttrs) {
            let _blocksInChunk = 0
            blockManager.traverseChunk(this.cx, this.cz, (x, y, z, block) => {
                let instanceIndex = this._computedInstanceIndex(x, y, z);
                if (block) {
                    _blocksInChunk++
                    this._instanceExtraDataAttribute.setX(instanceIndex, 1)
                    let animSpeed = blockTable[block.btype].animation === true ? 1 : 0
                    this._instanceExtraDataAttribute.setY(instanceIndex, animSpeed)
                    this._instanceDataAttribute.setXYZ(instanceIndex, block.tileX, block.tileY, block.lightness)
                } else {
                    this._instanceExtraDataAttribute.setX(instanceIndex, 0)
                }
            })

            this._instanceExtraDataAttribute.needsUpdate = true
            this._instanceDataAttribute.needsUpdate = true

        }

        this._instancedMesh.instanceMatrix.needsUpdate = true
        this.updateMatrix()
    }

    /**
     * Compute the instance index based on the block coordinates.
     * @param {number} x - The x-coordinate of the block.
     * @param {number} y - The y-coordinate of the block.
     * @param {number} z - The z-coordinate of the block.
     * @returns {number} - The computed instance index.
     */
    _computedInstanceIndex(x, y, z): number {
        return Chunk.computedInstanceIndex(this.bx0, this.bz0, x, y, z)
    }

    /**
     * Deallocate resources and clean up the chunk.
     */
    kill() {
        if (this._instancedMesh) {
            this._instancedMesh.geometry.dispose()
        }
    }

    /**
     * Set up the chunk at the specified coordinates.
     * @param {number} cx - The x-coordinate of the chunk.
     * @param {number} cz - The z-coordinate of the chunk.
     */
    setup(cx: number, cz: number) {
        let isWorldReady = worldManager.checkChunkGeneration(cx, cz)
        this.cx = cx
        this.cz = cz
        this.position.set(this.bx0, 0, this.bz0)

        if (isWorldReady) {
            this.sync()
        } else {
            this._updateGeometry(true)
        }
    }

    /**
     * Get a string representation of the chunk.
     * @returns {string} - A string representation of the chunk.
     */
    override toString() {
        return `Chunk(cx=${this.cx}, cz=${this.cz})`
    }

    /**
     * Compute the instance index based on the block coordinates.
     * @param {number} bx0 - The x-coordinate of the first block in the chunk.
     * @param {number} bz0 - The z-coordinate of the first block in the chunk.
     * @param {number} x - The x-coordinate of the block.
     * @param {number} y - The y-coordinate of the block.
     * @param {number} z - The z-coordinate of the block.
     * @returns {number} - The computed instance index.
     */
    static computedInstanceIndex(bx0, bz0, x, y, z): number {
        return Math.floor((x - bx0) + state.chunkSize * (y + state.worldHeight * (z - bz0)))
    }

    /**
     * Load a chunk with the specified coordinates.
     * @param {number} cx - The x-coordinate of the chunk.
     * @param {number} cz - The z-coordinate of the chunk.
     * @returns {Chunk} - The loaded chunk object.
     */
    static load(cx: number, cz: number) {
        let chunk: Chunk = _chunkPool.pop()
        if (chunk === undefined) {
            chunk = new Chunk({ cx, cz })
            logd('Chunk:load    ', `loading new chunk ${chunk.toString()}`)
        } else {
            chunk.setup(cx, cz)
            logd('Chunk:load', `loading from pool ${chunk.toString()}`)
        }

        chunk.visible = true
        monitoringData.chunksPoolSize = _chunkPool.length.toString()
        return chunk
    }

    /**
     * Unload a chunk and return it to the chunk pool.
     * @param {Chunk} chunk - The chunk object to unload.
     */
    static unload(chunk: Chunk) {
        if (_chunkPool.length < _chunkPoolLimit) {
            logd('Chunk:unload', `unloading to pool ${chunk.toString()}`)
            _chunkPool.push(chunk)
        }

        chunk.visible = true
        monitoringData.chunksPoolSize = _chunkPool.length.toString()
    }

    /**
     * Create the base instanced mesh for rendering blocks.
     * @returns {InstancedMesh} - The instanced mesh.
     */
    static _createInstancedMesh(): InstancedMesh {
        if (Chunk._baseInstancedMesh === null) {
            // Create base instanced block geometry and attributes
            const _instancedBlockGeometry = new InstancedBufferGeometry().copy(Block.getShapeGeometry());
            const _instanceDataArray = new Float32Array(blockManager.maxBlocksPerChunk * 3)
            const _instanceDataAttribute = new InstancedBufferAttribute(_instanceDataArray, 3);

            const _instaneExtraDataArray = new Float32Array(blockManager.maxBlocksPerChunk * 3)
            const _instanceExtraDataAttribute = new InstancedBufferAttribute(_instaneExtraDataArray, 3);


            // Get the base block material
            Chunk._baseBlockMaterial = Chunk._baseBlockMaterial || getBlockBaseMaterial()

            for (let i = 0; i < blockManager.maxBlocksPerChunk; i++) {
                _instanceDataAttribute.setXYZ(i, 0, 0, 1);
                _instanceExtraDataAttribute.setX(i, 0)
            }

            // Set instance attributes to the instanced geometry
            _instancedBlockGeometry.setAttribute('instanceData', _instanceDataAttribute);
            _instancedBlockGeometry.setAttribute('instanceExtraData', _instanceExtraDataAttribute);

            // Create the base instanced mesh
            Chunk._baseInstancedMesh = new InstancedMesh(_instancedBlockGeometry, Chunk._baseBlockMaterial, blockManager.maxBlocksPerChunk);

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
                        Chunk._baseInstancedMesh.setMatrixAt(Chunk.computedInstanceIndex(0, 0, x, y, z), dummy.matrix)
                    }
                }
            }

            Chunk._baseInstancedMesh.matrixAutoUpdate = false
            Chunk._baseInstancedMesh.updateMatrix()
            return Chunk._createInstancedMesh()
        } else {
            // Clone the base instanced mesh
            let clonedInstancedMesh = Chunk._baseInstancedMesh.clone()
            clonedInstancedMesh.geometry = Chunk._baseInstancedMesh.geometry.clone()

            clonedInstancedMesh.matrixAutoUpdate = false
            clonedInstancedMesh.updateMatrix()

            return clonedInstancedMesh
        }
    }
}
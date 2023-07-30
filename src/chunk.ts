import { Group, InstancedMesh, InstancedBufferGeometry, InstancedBufferAttribute, Object3D, Material, GridHelper } from "three"
import { logd } from "./utils"
import { state } from "./state"
import { getBlockBaseMaterial } from "./shaders"
import { Task } from "./tasker"
import { Block, BlockShape, blockManager } from "./blocks"
import { worldManager } from "./world"
import { monitoringData } from "./gui"
import { debounce } from "lodash"


const _chunkPool: Chunk[] = []
const _chunkPoolLimit = 128

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
    _instanceVisibilityAttribute: InstancedBufferAttribute = null
    _instancedMesh: InstancedMesh = null
    _gridHelper: GridHelper

    get bx0() {
        return this.cx * state.chunkSize
    }

    get bz0() {
        return this.cz * state.chunkSize
    }

    constructor({ cx, cz }) {
        logd('Chunk', `new [${cx}, ${cz}]}`)
        super()

        this.serial = Chunk._chunksCounter
        Chunk._chunksCounter++
        this.matrixAutoUpdate = false

        // instanced mesh
        this._instancedMesh = Chunk._createInstancedMesh()
        this._instanceDataAttribute = this._instancedMesh.geometry.attributes['instanceData'] as InstancedBufferAttribute
        this._instanceVisibilityAttribute = this._instancedMesh.geometry.attributes['instanceVisibility'] as InstancedBufferAttribute
        this.add(this._instancedMesh)

        this._gridHelper = new GridHelper(state.chunkSize, state.chunkSize, 0x999999, 0x999999)
        this._gridHelper.position.set(state.chunkSize / 2 - 0.5, 0, state.chunkSize / 2 - 0.5)
        this.add(this._gridHelper)
        this.setup(cx, cz)
        this._updateGeometry = debounce(this._updateGeometry.bind(this), 1000)
    }

    sync() {
        logd('Chunk.sync', this.toString())
        this._updateGeometry(true)
    }

    _updateGeometry(updateAttrs: boolean = false) {
        if (updateAttrs) {
            logd('Chunk._updateGeometry', `updating attributes at [${this.cx}, ${this.cz}]`)
            let _blocksInChunk = 0
            blockManager.traverseChunk(this.cx, this.cz, (x, y, z, block) => {
                let instanceIndex = this._computedInstanceIndex(x, y, z);
                if (block) {
                    _blocksInChunk++
                    this._instanceVisibilityAttribute.setX(instanceIndex, 1)
                    this._instanceDataAttribute.setXYZ(instanceIndex, block.tileX, block.tileY, block.lightness)
                } else {
                    this._instanceVisibilityAttribute.setX(instanceIndex, 0)
                }
            })

            this._instanceVisibilityAttribute.needsUpdate = true
            this._instanceDataAttribute.needsUpdate = true

            logd('Chunk._updateGeometry', `blocks in chunk [${this.cx}, ${this.cz}] - ${_blocksInChunk}`)
        }

        this._instancedMesh.instanceMatrix.needsUpdate = true
        this.updateMatrix()
    }

    _computedInstanceIndex(x, y, z): number {
        return Chunk.computedInstanceIndex(this.bx0, this.bz0, x, y, z)
    }


    kill() {
        if (this._instancedMesh) {
            this._instancedMesh.geometry.dispose()
        }
    }

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

    override toString() {
        return `Chunk(cx=${this.cx}, cz=${this.cz})`
    }

    static computedInstanceIndex(bx0, bz0, x, y, z): number {
        return Math.floor((x - bx0) + state.chunkSize * (y + state.worldHeight * (z - bz0)))
    }

    static load(cx: number, cz: number) {
        let chunk: Chunk = _chunkPool.pop()
        if (chunk === undefined) {
            chunk = new Chunk({ cx, cz })
            logd('Chunk:load    ', `loading new chunk ${chunk.toString()}`)
        } else {
            chunk.setup(cx, cz)
            logd('Chunk:load', `loading from pool ${chunk.toString()}`)
        }

        monitoringData.chunksPoolSize = _chunkPool.length.toString()
        return chunk
    }

    static unload(chunk: Chunk) {
        if (_chunkPool.length < _chunkPoolLimit) {
            logd('Chunk:unload', `unloading to pool ${chunk.toString()}`)
            _chunkPool.push(chunk)
        }

        monitoringData.chunksPoolSize = _chunkPool.length.toString()
    }

    static _createInstancedMesh(): InstancedMesh {
        if (Chunk._baseInstancedMesh === null) {
            const _instancedBlockGeometry = new InstancedBufferGeometry().copy(Block.getShapeGeometry());
            const _instanceDataArray = new Float32Array(blockManager.maxBlocksPerChunk * 3)
            const _instanceDataAttribute = new InstancedBufferAttribute(_instanceDataArray, 3);

            const _instanceVisibilityArray = new Float32Array(blockManager.maxBlocksPerChunk)
            const _instanceVisibilityAttribute = new InstancedBufferAttribute(_instanceVisibilityArray, 1);

            Chunk._baseBlockMaterial = Chunk._baseBlockMaterial || getBlockBaseMaterial()

            for (let i = 0; i < blockManager.maxBlocksPerChunk; i++) {
                _instanceDataAttribute.setXYZ(i, 0, 0, 1);
                _instanceVisibilityAttribute.setX(i, 0)
            }

            _instancedBlockGeometry.setAttribute('instanceData', _instanceDataAttribute);
            _instancedBlockGeometry.setAttribute('instanceVisibility', _instanceVisibilityAttribute);

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

            let clonedInstancedMesh = Chunk._baseInstancedMesh.clone()
            clonedInstancedMesh.geometry = Chunk._baseInstancedMesh.geometry.clone()

            clonedInstancedMesh.matrixAutoUpdate = false
            clonedInstancedMesh.updateMatrix()

            return clonedInstancedMesh
        }
    }

}
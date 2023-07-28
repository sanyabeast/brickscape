import { Group, Mesh, BoxGeometry, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, InstancedMesh, Object3D, InstancedBufferGeometry, InstancedBufferAttribute, TextureLoader, BufferGeometry, CylinderGeometry } from "three"
import { dummy, getBlockId, getChunkId, getRandomHexColor, lerp } from "./utils"
import { BlockShape, blocksHelper, maxBlocksInChunk, state } from "./state"
import { debounce, filter, isNumber, isUndefined, orderBy, throttle, values } from "lodash"
import { VoxelBlockMaterial } from "./shaders"
import { QueueType, Task } from "./tasker"


let _chunksCounter = 0;
const maxBlockAge = 2

enum BlockType {
    None,
    Gravel,
    Rock,
    Dirt,
    Sand,
    Bedrock,
    Water
}

export interface IBlockTable {
    [x: string]: {
        type: BlockType
        tile: number[],
        generate?: boolean,
        levels?: number[],
        rate?: number,
        replace?: boolean,
        order?: number
    }
}

export const blockTable: IBlockTable = {
    [BlockType.None]: {
        type: BlockType.None,
        tile: [0, 0],
    },
    [BlockType.Gravel]: {
        type: BlockType.Gravel,
        tile: [0, 0]
    },
    [BlockType.Rock]: {
        type: BlockType.Rock,
        tile: [0, 1]
    },
    [BlockType.Dirt]: {
        type: BlockType.Dirt,
        tile: [2, 0],
        generate: true,
        levels: [4, 32],
        rate: 1,
        replace: false,
        order: 0
    },
    [BlockType.Sand]: {
        type: BlockType.Sand,
        tile: [2, 1]
    },
    [BlockType.Bedrock]: {
        type: BlockType.Bedrock,
        tile: [1, 1]
    },
    [BlockType.Water]: {
        type: BlockType.Water,
        tile: [15, 13]
    }
}

export const blockTableOrdered = orderBy(filter(values(blockTable), (d) => d.generate), (d) => d.order)

function _getInstanceIndex(x, y, z): number {
    return Math.floor(x + state.chunkSize * (y + state.worldHeight * z))
    // let  index = 0;
    // for (let ix = 0; ix < x; ix++){
    //     for (let iz = 0; iz < z; iz++){
    //         for (let iy = 0; iy < y; iy++){
    //             index++
    //         }
    //     }
    // }
    // return index
}

export type FChunkGridIteratee = (x: number, y: number, z: number, instanceIndex: number, blockId: string, block?: Block) => void
export type FChunkGridIterateeXZ = (x: number, z: number) => void
export type FSiblingIteratee = (sibling: Block, dx: number, dy: number, dz: number) => void
export class Block extends Object3D {
    static getShapeGeometry(): InstancedBufferGeometry {
        switch (state.blockShape) {
            case BlockShape.Prism6: {
                let g = new CylinderGeometry(1, 1, 1, 6) as any as InstancedBufferGeometry
                g.scale(1 / 1.732, 1, 1 / 1.5);
                return g;
            }
            default: {
                return new BoxGeometry(1, 1, 1) as any as InstancedBufferGeometry
            }
        }
    }

    bx: number = null
    by: number = null
    bz: number = null
    bid: string = null
    btype: BlockType = BlockType.None
    instanceIndex: number = null
    lightness: number = 1
    lastUpdate: number = Math.random()

    get age() {
        return (+new Date() - this.lastUpdate) / 1000
    }

    get tileX(): number {
        return blockTable[this.btype].tile[0]
    }

    get tileY(): number {
        return blockTable[this.btype].tile[1]
    }

    constructor({ x, y, z, chunk, lightness, blockType }) {
        // const material = new MeshBasicMaterial({ color: getRandomHexColor() });
        super();

        this.bx = x;
        this.by = y;
        this.bz = z;
        this.bid = getBlockId(x, y, z);

        if (state.blocks[this.bid]) {
            console.log(`block exists at: ${x}, ${y}, ${z}`)
            return this
        }

        state.blocks[this.bid] = this

        switch (state.blockShape) {
            case BlockShape.Prism6: {
                if (z % 2 == 0) {
                    x += 0.5
                }
                this.position.set(x - chunk.position.x, y - chunk.position.y, z - chunk.position.z)
                break;
            }
            default: {
                this.position.set(x - chunk.position.x, y - chunk.position.y, z - chunk.position.z)
            }
        }

        this.instanceIndex = _getInstanceIndex(
            x - chunk.position.x, y - chunk.position.y, z - chunk.position.z
        )

        this.update({ lightness, blockType })
        this.lastUpdate = 0
        this.updateMatrix()
    }

    kill() {
        delete state.blocks[this.bid]
    }

    iterateSiblings(distance: number = 1, iteratee: FSiblingIteratee) {
        distance = Math.round(distance)
        for (let x = -distance; x <= distance; x++) {
            for (let y = -distance; y <= distance; y++) {
                for (let z = -distance; z <= distance; z++) {
                    let blockId = getBlockId(x + this.bx, y + this.by, z + this.bz)
                    let siblingBlock = state.blocks[blockId]
                    if (siblingBlock) {
                        iteratee(siblingBlock, x, y, z)
                    }
                }
            }
        }
    }
    update({ lightness, blockType }): boolean {
        let changed = (lightness !== this.lightness) || (blockType !== this.btype)
        this.lightness = lightness
        this.btype = blockType
        this.lastUpdate = +new Date()
        return changed
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
            let instanceIndices = new Float32Array(maxBlocksInChunk * 3 * 10)
            let attribute = this._instancedAttribute = new InstancedBufferAttribute(instanceIndices, 3);
            for (let i = 0; i < maxBlocksInChunk; i++) {
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
        this._iterateChunkGrid((x, y, z, instanceIndex, blockId, block) => {
            if (block && block.age > maxBlockAge) {
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
            let existingBlock = blocksHelper.getBlockAt(x, waterLevel, z)
            if (!existingBlock) {
                new Block({
                    chunk: this,
                    x: x,
                    y: waterLevel,
                    z: z,
                    lightness: 1,
                    blockType: BlockType.Water
                })
            } else {
                console.log(`block exists`)
            }

        })


        this._generateInstancedMeshes()
    }

    _updateBlocksTypes(): boolean {
        let changed = false
        console.log(blockTableOrdered)
        this._iterateChunkGrid((x, y, z, instanceIndex, blockId, block) => {
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
        this._iterateChunkGrid((x, y, z, instanceIndex, blockId, block) => {
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
                    let blockId = getBlockId(x + (this.cx * state.chunkSize), y, z + (this.cz * state.chunkSize))
                    iteratee(x + (this.cx * state.chunkSize), y, z + (this.cz * state.chunkSize), _getInstanceIndex(x, y, z), blockId, state.blocks[blockId])
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
        let material = new VoxelBlockMaterial({ color: 0xFFFFFF })
        const instancedMesh = this._instancedMesh = new InstancedMesh(this._instancedBlockGeometry, material, maxBlocksInChunk);
        this._iterateChunkGrid((x, y, z, instanceIndex, blockId, block) => {
            if (block) {
                instancedMesh.setMatrixAt(instanceIndex, block.matrix);
            } else {
                instancedMesh.setMatrixAt(instanceIndex, dummy.matrix);
            }
        })

        this.add(instancedMesh)
    }

    _updateInstancedAttributes() {
        this._iterateChunkGrid((x, y, z, instanceIndex, blockId, block) => {
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
import { Group, Mesh, BoxGeometry, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, InstancedMesh, Object3D, InstancedBufferGeometry, InstancedBufferAttribute, TextureLoader, BufferGeometry, CylinderGeometry } from "three"
import { getBlockId, getChunkId, getRandomHexColor, lerp } from "./utils"
import { BlockShape, maxBlocksInChunk, state } from "./state"
import { debounce, throttle } from "lodash"
import { VoxelBlockMaterial } from "./shaders"
import { QueueType, Task } from "./tasker"


let _chunksCounter = 0;

enum BlockType {
    None,
    Gravel,
    Rock,
    Dirt,
    Sand
}

const blockTypes = {
    [BlockType.None]: {
        tile: [0, 0]
    },
    [BlockType.Gravel]: {
        tile: [0, 0]
    },
    [BlockType.Rock]: {
        tile: [0, 1]
    },
    [BlockType.Dirt]: {
        tile: [2, 0]
    },
    [BlockType.Sand]: {
        tile: [2, 1]
    }
}

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

    get tileX(): number {
        return blockTypes[this.btype].tile[0]
    }

    get tileY(): number {
        return blockTypes[this.btype].tile[1]
    }

    constructor({ x, y, z, chunk }) {
        // const material = new MeshBasicMaterial({ color: getRandomHexColor() });
        super();

        this.bx = x;
        this.by = y;
        this.bz = z;
        this.bid = getBlockId(x, y, z);

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

        this.updateChunkMatrix = throttle(this.updateChunkMatrix.bind(this), 1000 / 15)
        this.refresh = debounce(this.refresh.bind(this), 32)

        this.refresh()
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

    refresh() {
        if (!this._built) {
            this._buildTask = state.tasker.add((done) => {
                this._built = true
                this._buildTask = null

                this._initBlockGeometry()
                this._buildChunk()

                this.updateChunkMatrix()
                this.updateBlocks()
                this.visible = true
                done()
            }, ['chunk', this.cid], QueueType.Reversed)
        } else {
            this.updateBlocks()
        }

    }

    updateBlocks() {
        // console.log(`updating blocks at ${this.toString()}...`)
        if (this._built) {
            state.tasker.add((done) => {
                this._updateBlocksShading()
                this._updateInstancedAttributes()
                done()
            }, ['chunk', this.cid, 'update-blocks-shading'], QueueType.Reversed)

            this._updateBlocksTypes();
            this._updateInstancedAttributes()
        }
    }

    updateChunkMatrix() {
        this._instancedMesh.instanceMatrix.needsUpdate = true
        this.updateMatrix()
    }

    _buildChunk() {
        // console.log(`building blocks at ${this.toString()}...`)
        for (let z = 0; z < state.chunkSize; z++) {
            for (let x = 0; x < state.chunkSize; x++) {
                let noiseValue = state.generator.getNoiseValue({
                    x: x + (this.cx * state.chunkSize),
                    y: z + (this.cz * state.chunkSize),
                    scale: 0.01,
                    iterations: 32
                })

                let heightValue = Math.floor(state.worldHeight * noiseValue) + 1

                for (let i = 0; i < heightValue; i++) {
                    let blockId = getBlockId(x + (this.cx * state.chunkSize), i, z + (this.cz * state.chunkSize))
                    if (state.blocks[blockId] === undefined) {
                        this.blocks.push(new Block({
                            chunk: this,
                            x: x + (this.cx * state.chunkSize),
                            y: i,
                            z: z + (this.cz * state.chunkSize)
                        }))
                    } else {

                        console.log(state.blocks[blockId])
                    }
                }

                this._generateInstancedMeshes()
            }
        }


    }

    _generateInstancedMeshes() {
        let material = new VoxelBlockMaterial({ color: 0xFFFFFF })
        const instancedMesh = this._instancedMesh = new InstancedMesh(this._instancedBlockGeometry, material, this.blocks.length);
        this.blocks.forEach((block, index) => {
            block.instanceIndex = index
            instancedMesh.setMatrixAt(index, block.matrix);
        })

        this.add(instancedMesh)
    }

    _updateBlocksTypes() {
        this.blocks.forEach((block, index) => {
            if (block.btype === BlockType.None) {
                let sibDistance = 1
                let noiseValue = state.generator.getPerlin3DNoise({
                    x: block.bx + (this.cx * state.chunkSize),
                    y: block.by + (this.cz * state.chunkSize),
                    iterations: 4
                })

                if (block.by < 2) {
                    block.btype = BlockType.Rock
                } else if (block.by < 3) {
                    block.btype = BlockType.Gravel
                } else if (block.by < 4) {
                    block.btype = BlockType.Sand
                } else {
                    block.btype = BlockType.Dirt
                }
            }
        })
    }

    _updateBlocksShading() {
        this.blocks.forEach((block, index) => {
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

            block.lightness = lightness
        })
    }

    _updateInstancedAttributes() {
        this.blocks.forEach((block, index) => {
            this._instancedAttribute.setXYZ(block.instanceIndex, block.tileX, block.tileY, block.lightness)
        })

        this._instancedAttribute.needsUpdate = true
    }

    update() {

    }
    isSameChunk(cx, cz) {
        return cx === this.cx && cz === this.cz
    }

    snooze() {
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
        if (this._instancedBlockGeometry){
            this._instancedBlockGeometry.dispose()
            delete this._instancedBlockGeometry
        }
        
    }

    override toString() {
        return `Chunk(cx=${this.cx}, cz=${this.cz})`
    }
}
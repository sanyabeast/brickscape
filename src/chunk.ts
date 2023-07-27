import { Group, Mesh, BoxGeometry, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, InstancedMesh, Object3D, InstancedBufferGeometry, InstancedBufferAttribute } from "three"
import { getBlockId, getChunkId, getRandomHexColor } from "./utils"
import { maxBlocksInChunk, state } from "./state"
import { debounce, throttle } from "lodash"
import { VoxelBlockMaterial } from "./shaders"
import { QueueType, Task } from "./tasker"




let _chunksCounter = 0;

export class Block extends Object3D {
    blockX: number = null
    blockY: number = null
    blockZ: number = null
    blockId: string = null
    instanceIndex: number = null
    constructor({ chunk, x, y, z }) {
        // const material = new MeshBasicMaterial({ color: getRandomHexColor() });
        super();

        this.blockX = x + chunk.cx;
        this.blockY = y;
        this.blockZ = z + chunk.cz;
        this.blockId = getBlockId(x + chunk.cx, y, z + chunk.cz);

        state.blocks[this.blockId] = this

        this.position.set(x, y, z)
        this.updateMatrix()
    }

    kill() {
        delete state.blocks[this.blockId]
    }
}


export class Chunk extends Group {
    chunkId: string = null
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
        this.chunkId = getChunkId(cx, cz)
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
            const instancedBlockGeometry = this._instancedBlockGeometry = new InstancedBufferGeometry().copy(new BoxGeometry(1, 1, 1) as any);
            let instanceIndices = new Float32Array(maxBlocksInChunk * 4)

            let attribute = this._instancedAttribute = new InstancedBufferAttribute(instanceIndices, 4);
            for (let i = 0; i < maxBlocksInChunk; i++) {
                attribute.setXYZW(i, 0, 0, 1, i);
            }
            instancedBlockGeometry.setAttribute('instanceIndex', attribute);
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
                this._updateBlocksMaterials()
                this.visible = true
                done()
            }, ['chunk', this.chunkId], QueueType.Reversed)
        } else {
            this._updateBlocksMaterials()
        }

    }

    updateBlocksMaterials() {
        if (this._built) {
            this._updateBlocksMaterials()
        }
    }

    updateChunkMatrix() {
        this._instancedMesh.instanceMatrix.needsUpdate = true
        this.updateMatrix()
    }

    _buildChunk() {
        for (let z = 0; z < state.chunkSize; z++) {
            for (let x = 0; x < state.chunkSize; x++) {
                let noiseValue = state.generator.sine.getNoiseValue({
                    x: x + (this.cx * state.chunkSize),
                    y: z + (this.cz * state.chunkSize),
                    scale: 0.01,
                    iterations: 32
                })

                let heightValue = Math.floor(state.worldHeight * noiseValue) + 1

                for (let i = 0; i < heightValue; i++) {
                    let blockId = getBlockId(x + (this.cx * state.chunkSize), i, z + (this.cz * state.chunkSize))
                    if (state[blockId] === undefined) {
                        this.blocks.push(new Block({
                            chunk: this,
                            x: x,
                            y: i,
                            z: z
                        }))
                    } else {
                        console.log(state[blockId])
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

    _updateBlocksMaterials() {

        state.tasker.add((done) => {
            this.blocks.forEach((block, index) => {
                let siblings = this.getShadingSiblings(block.blockX, block.blockY, block.blockZ)
                // console.log(siblings)

                let brightness = 1 - (siblings.length / 9)
                brightness = state.blocks[getBlockId(block.blockX, block.blockY + 1, block.blockZ)] ? 1 : 0

                this._instancedAttribute.setXYZW(block.instanceIndex, 0, 0, brightness, block.instanceIndex)
            })

            this._instancedAttribute.needsUpdate = true
            done()
        }, ['chunk', this.chunkId, 'update-materials'], QueueType.Random)
    }

    getMaxSiblingsCount() {
        return 6
    }

    getShadingSiblings(bx, by, bz) {
        let siblings = []

        for (let x = -1; x < 1; x++) {
            for (let z = -1; z < 1; z++) {
                if (state.blocks[getBlockId(bx + x, by + 1, bz + z)]) {
                    siblings.push(state.blocks[getBlockId(bx + x, by + 1, bz + z)])
                }

            }
        }

        return siblings
    }

    getSiblings(bx, by, bz) {
        let siblings = []

        if (state.blocks[getBlockId(bx + 1, by, bz)]) {
            siblings.push(state.blocks[getBlockId(bx + 1, by, bz)])
        }

        if (state.blocks[getBlockId(bx - 1, by, bz)]) {
            siblings.push(state.blocks[getBlockId(bx - 1, by, bz)])
        }

        if (state.blocks[getBlockId(bx, by + 1, bz)]) {
            siblings.push(state.blocks[getBlockId(bx, by + 1, bz)])
        }

        if (state.blocks[getBlockId(bx, by - 1, bz)]) {
            siblings.push(state.blocks[getBlockId(bx, by - 1, bz)])
        }

        if (state.blocks[getBlockId(bx, by, bz + 1)]) {
            siblings.push(state.blocks[getBlockId(bx, by, bz + 1)])
        }

        if (state.blocks[getBlockId(bx, by, bz - 1)]) {
            siblings.push(state.blocks[getBlockId(bx, by, bz - 1)])
        }


        return siblings
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
        this._instancedBlockGeometry.dispose()
    }
}
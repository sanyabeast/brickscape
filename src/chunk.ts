import { Group, Mesh, BoxGeometry, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, InstancedMesh } from "three"
import { getBlockId, getChunkId, getRandomHexColor } from "./utils"
import { state } from "./state"
import { debounce, throttle } from "lodash"
import { VoxelBlockMaterial } from "./shaders"

const blockGeometry = new BoxGeometry(1, 1, 1);
const blockDummyMaterial = new MeshLambertMaterial();

export class Block extends Mesh {
    blockX: number = null
    blockY: number = null
    blockZ: number = null
    blockId: string = null
    override material: VoxelBlockMaterial
    constructor({ chunk, x, y, z }) {
        const geometry = blockGeometry;
        // const material = new MeshBasicMaterial({ color: getRandomHexColor() });
        const material = blockDummyMaterial
        super(geometry, material);

        this.blockX = x + chunk.cx;
        this.blockY = y;
        this.blockZ = z + chunk.cz;
        this.blockId = getBlockId(x + chunk.cx, y, z + chunk.cz);

        state.blocks[this.blockId] = this

        this.position.set(x, y, z)
        this.updateMatrix()
    }

    kill() {
        this.geometry.dispose()
        delete state.blocks[this.blockId]
    }
}

export class Chunk extends Group {
    chunkId: string = null
    cx: number = null
    cz: number = null
    createdAt: number = null
    active: boolean = false
    blocks: Block[] = null
    instanced: InstancedMesh[] = null

    constructor({ cx, cz }) {
        super()
        this.cx = cx
        this.cz = cz
        this.chunkId = getChunkId(cx, cz)
        this.createdAt = +new Date()
        this.blocks = []
        this.instanced = []

        this.position.set(cx * state.chunkSize, 0, cz * state.chunkSize)
        this.matrixAutoUpdate = false

        this.visible = false
        state.tasker.add((done) => {
            this._buildChunk()

            this.refresh = debounce(this.refresh.bind(this), 32)
            this.updateChunkMatrix = throttle(this.updateChunkMatrix.bind(this), 1000 / 15)
            this.updateChunkMatrix()
            this.visible = true
            done()
        })

    }

    refresh() {

    }

    updateChunkMatrix() {

        this.instanced.forEach((mesh: InstancedMesh) => {
            mesh.instanceMatrix.needsUpdate = true
        })
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

                setTimeout(() => {
                    this._generateInstancedMeshes()
                })
            }
        }

        setTimeout(() => {
            this._updateBlocksMaterials()
        })
    }

    _generateInstancedMeshes() {
        let material = new VoxelBlockMaterial({ color: 0xEEEEEE })
        const instancedMesh = new InstancedMesh(blockGeometry, material, this.blocks.length);
        this.blocks.forEach((block, index) => {
            instancedMesh.setMatrixAt(index, block.matrix);
        })
        this.add(instancedMesh)
        this.instanced.push(instancedMesh)
    }

    _updateBlocksMaterials() {
        for (let k in state.blocks) {
            let block = state.blocks[k]
            // let siblings = this.getSiblings(block.blockX, block.blockY, block.blockZ)

            // let darkness = siblings.length / this.getMaxSiblingsCount()
            // // console.log(darkness)
            // let bright = (1 - darkness)
            // block.material.color.setRGB(bright, bright, bright)

            let blockElevation = block.blockY
            let darkness = (blockElevation + 1) / state.worldHeight
            block.material.color.setRGB(darkness, darkness, darkness)
        }
    }

    getMaxSiblingsCount() {
        return 6
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
}